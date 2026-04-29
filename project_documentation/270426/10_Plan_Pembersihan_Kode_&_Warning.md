# Plan: Pembersihan Kode & Resolusi Warning IDE

Berdasarkan analisis log konsol IDE, terdapat beberapa peringatan (warnings) terkait impor yang tidak digunakan, variabel yang tidak terpakai, dan masalah keamanan tipe data null (Null Type Safety) di sisi Backend.

## 1. Tujuan
Meningkatkan kualitas kode, mengurangi "noise" pada log kompilasi, dan memastikan aplikasi lebih stabil terhadap potensi `NullPointerException` dengan mengikuti standar keamanan tipe Java terbaru.

## 2. Rencana Perbaikan

### A. Penghapusan Impor & Variabel Tidak Terpakai
- **`CustomOrderRequestDTO.java`**: Menghapus import `jakarta.validation.constraints.Pattern`.
- **`JwtAuthenticationFilter.java`**: Menghapus import `org.springframework.security.authentication.AnonymousAuthenticationToken`.
- **`PaymentService.java`**: Menghapus variabel lokal `order` pada metode `processPaymentNotification` karena data order diakses langsung menggunakan `orderId`.

### B. Resolusi Null Type Safety (Peringatan Dominan)
Banyak peringatan muncul karena compiler Java (atau plugin IDE) mendeteksi potensi nilai `null` pada parameter yang diharapkan `non-null`.

- **Penyebab**: Penggunaan method seperti `orderRepository.findById(orderId)` atau `redisTemplate.opsForValue().set(...)` yang melibatkan tipe data wrapper (Integer, String) tanpa pengecekan eksplisit atau anotasi pendukung.
- **Solusi**: 
    1. Menggunakan `@SuppressWarnings("null")` pada baris yang sudah dipastikan aman (misal: setelah `orElseThrow`).
    2. Menambahkan pengecekan `if (variable != null)` sebelum variabel digunakan dalam operasi library pihak ketiga (Redis/Jackson).
    3. Memastikan parameter pada method service memiliki anotasi `@Nullable` atau `@NonNull` yang konsisten.

## 3. Detail File yang Terdampak
1. **`CartService.java`**: Fokus pada operasi Redis (opsForValue) dan konversi tipe data Integer pada pencarian produk/custom order.
2. **`CloudinaryUploadService.java`**: Penanganan path directory yang berpotensi null.
3. **`OrderService.java`**: Validasi ID pada riwayat pelacakan (tracking history).
4. **`PaymentService.java`**: Validasi ID order pada proses pembuatan token.
5. **`UserService.java`**: Penanganan objek User hasil pencarian repository.

---

## 4. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **IDE (VS Code/IntelliJ)**: Untuk verifikasi real-time setelah perubahan dilakukan.
2. **Review Manual**: Untuk memastikan penghapusan variabel tidak memengaruhi logika bisnis yang tersembunyi.
3. **Unit Testing**: Menjalankan test case pada modul Cart, Order, dan Payment untuk memastikan tidak ada regresi setelah pembersihan kode.
