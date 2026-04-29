# Laporan Analisis Backend E-Commerce Otaku

Berdasarkan pengecekan statis pada kode sumber backend (Spring Boot + SQL Server + JPA), keseluruhan arsitektur sudah terbangun dengan pola yang baik (Controller -> Service -> Repository). Namun, ada beberapa temuan kritis terkait celah keamanan (data leak), bug serialisasi Jackson, dan potensi error yang akan muncul di *runtime*.

Berikut adalah hasil analisa detail:

## 1. 🚨 Temuan Kritis (High Priority Bugs & Security)

### A. Jackson Serialization Bug & Password Leak pada `CustomOrderController`
- **Lokasi**: `CustomOrderController.java` & `CustomOrder.java`
- **Masalah**: Endpoint `POST /api/v1/custom-orders` mengembalikan data konkrit `ResponseEntity.ok(savedCustomOrder);` secara langsung (bukan bentuk DTO). Di dalam `CustomOrder`, kolom `user` di-mapping menggunakan `@ManyToOne(fetch = FetchType.LAZY)`. 
- **Dampak**: 
  1. Ini akan memicu `InvalidDefinitionException` (Server Error 500) saat Jackson mencoba me-render objek proxy Hibernate.
  2. Jika proxy diabaikan oleh Jackson module khusus, seluruh entitas `User` beserta isinya akan ikut terekspos dalam JSON response.
  3. **Yang terparah**: Entitas `User` memiliki field `passwordHash` yang **tidak memiliki anotasi `@JsonIgnore`**. Ini berarti *password hash* dari user akan ter-expose bocor ke siapapun yang memanggil API tersebut!
- **Solusi**: Buatlah class `CustomOrderResponseDTO` untuk me-render data ke JSON, **Bukan** mengembalikan langsung objek entitas. Tambahkan `@JsonIgnore` pada property `passwordHash` di `User.java`.

### B. Information Exposure (Data Leak) pada `GlobalExceptionHandler`
- **Lokasi**: `GlobalExceptionHandler.java` (Method `handleGlobalException` dan `handleRuntimeException`)
- **Masalah**: Pesan asli exception dilekatkan secara langsung (`ex.getMessage()`) ke response JSON `"Terjadi kesalahan pada sistem: " + ex.getMessage()`.
- **Dampak**: Jika terjadi error koneksi atau SQL Exception saat eksekusi query, pesan error yang mengandung URI Database, baris kode spesifik, syntax SQL, atau konfigurasi sensitif akan terekspos sepenuhnya ke sisi *Client* / *Hacker*.
- **Solusi**: Sembunyikan implementasi internal di `Exception.class`. Cukup berikan response *"Terjadi kesalahan tak terduga pada server"* dan lakukan *logging error* secara _internal_ memanfaatkan `Sl4j` atau `Logback`. 

## 2. ⚠️ Temuan Menengah (Medium Priority)

### A. Logic Cacat pada `AuthService.java`
- **Lokasi**: `AuthService.java` (Method `login` dan `generateTokenForLogin`)
- **Masalah**: 
  1. Terdapat blok _try-catch_ kosong (`catch (Exception e) {}`) pada saat memanggil `passwordEncoder.matches`. *Swallowing exceptions* sangat dilarang karena menutupi kegagalan algoritma *hashing*.
  2. Fallback perbandingan password (`!user.getPasswordHash().equals(dto.getPassword())`) mengizinkan login melalui plaintext jika hash di DB terkompromi/salah mapping.
  3. Performa SQL rangkap: `Controller` memanggil `authService.login(request)` dan *langsung* memanggil `generateTokenForLogin(request)`. Keduanya secara independen melakukan pemanggilan query SQL yang _persis sama_ yaitu `userRepository.findByEmail(dto.getEmail())`. 
- **Solusi**: Satukan fitur autentikasi. Biarkan method `login` langsung bertanggung jawab men-generate dan mengembalikan token JWT-nya, bukan sekadar me-return objek User dan membebankan tokennya ke method terpisah secara manual.

### B. Hilangnya Anotasi Validasi DTO
- **Lokasi**: Berbagai Kelas DTO (`OrderRequestDTO`, `CustomOrderRequestDTO`, dsb) di integrasi dengan Controller (misal `createOrder` dan `createCustomOrder`).
- **Masalah**: Tidak ada validasi `spring-boot-starter-validation` (seperti `@NotBlank`, `@NotNull`, `@Min(1)`) di bagian parameter `@RequestBody` Controller.
- **Dampak**: Input spam atau JSON kosong (empty string / minus items / negative prices) dapat masuk hingga layer *Service/Database* menyebabkan exception yang seharusnya bisa dihadang lebih murah biayanya pada gerbang _controller_.

## 3. 📝 Temuan Ringan (Low Priority / Best Practices)

### A. Kredensial Hardcode di Konfigurasi `application.yml`
- **Lokasi**: `application.yml`
- **Masalah**: `spring.datasource.password: password` di *hard-code* secara eksplisit.
- **Solusi**: Menggunakan environment variables seperti `${DB_PASSWORD:password}` agar aman saat naik ke tahap _Staging/Production_.

---
**Kesimpulan**: Prioritas segera yang ditekankan untuk diperbaiki agar aplikasi berjalan stabil & aman adalah **Temuan 1A (Mencegah Password ter-Leak dan 500 Jackson Serialization Error)** dan **Temuan 1B**.
