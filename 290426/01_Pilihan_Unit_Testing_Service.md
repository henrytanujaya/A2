# Rencana & Pilihan Unit Testing Service

Unit Testing sangat penting untuk memastikan stabilitas aplikasi (terutama sebelum *Live Demo* atau *Production*). Untuk *backend* berbasis Spring Boot ini, kita akan menggunakan **JUnit 5** dan **Mockito**.

Berikut adalah 3 pilihan *Service* di `backend/src/main/java/com/otaku/ecommerce/service/` yang sangat direkomendasikan untuk dibuatkan *Unit Test*-nya, diurutkan dari yang paling krusial:

## Pilihan Service

### Pilihan 1: `OrderService.java` (Sangat Direkomendasikan 🔥)
*   **Alasan**: Ini adalah jantung dari aplikasi E-commerce Anda. Mengelola pembuatan pesanan, kalkulasi harga, diskon, transisi status (Pending -> Waiting_Verification -> Processing), dan validasi pembayaran.
*   **Fokus Test**:
    *   Apakah kalkulasi total harga keranjang sudah benar?
    *   Apakah diskon berhasil diterapkan?
    *   Apakah status pesanan berubah dengan benar saat pembayaran divalidasi?

### Pilihan 2: `AuthService.java` (Krusial untuk Keamanan 🔒)
*   **Alasan**: Mengatur registrasi user, autentikasi login, dan pembuatan token JWT. Jika service ini rusak, tidak ada user yang bisa masuk.
*   **Fokus Test**:
    *   Apakah sistem menolak login jika *password* salah?
    *   Apakah sistem melempar error jika *email* sudah terdaftar saat registrasi?
    *   Apakah token JWT berhasil *di-generate* dengan format yang benar?

### Pilihan 3: `AuditService.java` (Sederhana & Cepat 📊)
*   **Alasan**: Service ini relatif lebih kecil dan terisolasi, cocok sebagai "Pemanasan" pembuatan Unit Test. 
*   **Fokus Test**:
    *   Apakah perhitungan Total Pendapatan (`totalRevenue`) dan Total Pesanan berjalan akurat berdasarkan data *mock* dari database?

---

## Rundown / Langkah Pembuatan Unit Test

Jika Anda sudah memilih salah satu *Service* di atas, berikut adalah *rundown* sistematis bagaimana saya akan mengimplementasikannya:

### Tahap 1: Persiapan (*Setup*)
1.  **Verifikasi Dependensi**: Memastikan `spring-boot-starter-test` (JUnit 5, Mockito) sudah ada di `pom.xml`.
2.  **Pembuatan Folder**: Membuat struktur folder test yang sesuai, yaitu `backend/src/test/java/com/otaku/ecommerce/service/`.

### Tahap 2: *Mocking* Lingkungan
1.  Membuat kelas test baru (misal: `OrderServiceTest.java`).
2.  Menggunakan anotasi `@ExtendWith(MockitoExtension.class)`.
3.  Memasang `@Mock` untuk semua *Repository* atau *Service* eksternal yang dipanggil oleh *Service* utama (misalnya `OrderRepository`, `UserRepository`, `CartRepository`).
4.  Memasang `@InjectMocks` pada *Service* yang sedang diuji agar semua *mock* terinjeksi otomatis.

### Tahap 3: Penulisan Skenario (Given - When - Then)
1.  **Given**: Menyiapkan data dummy (Data Dummy User, CartItem, Product, dll).
2.  **When**: Memanggil fungsi (misal `orderService.createOrder()`).
3.  **Then**: Memvalidasi hasil menggunakan `assertEquals` atau `assertNotNull`, serta memastikan repository dipanggil menggunakan `Mockito.verify()`.

### Tahap 4: Eksekusi & Validasi
1.  Menjalankan tes menggunakan perintah `mvn test` (atau via UI VS Code).
2.  Mengecek apakah semua *assertions* (perkiraan hasil) bernilai *PASS* (hijau).

---

> [!NOTE]
> Silakan balas pesan ini dengan menyebutkan **Pilihan Service (1, 2, atau 3)** yang ingin Anda buatkan tesnya terlebih dahulu. Saya akan langsung menyiapkan kodenya!
