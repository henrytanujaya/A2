# Dokumentasi Perubahan Sistem
**Tanggal:** 29 April 2026
**Periode Pengerjaan:** 00:00 - 17:00 WIB

Dokumen ini merangkum seluruh aktivitas pengerjaan, perbaikan bug, dan penambahan fitur yang dilakukan pada rentang waktu 00:00 hingga 17:00 WIB di tanggal 29 April 2026.

---

## 1. Optimasi Admin Dashboard & Reporting (01:30 - 02:11 WIB)
Pada tahap ini, fokus pengerjaan adalah pada penyempurnaan UI/UX dan fungsionalitas manajemen data pada panel Admin untuk meningkatkan kemudahan pengawasan operasional.

**Perubahan yang dilakukan:**
- **Standarisasi Pagination:** Menerapkan batasan konsisten sebanyak 10 item per halaman untuk seluruh daftar atau tabel yang ada di panel admin.
- **Penyesuaian Metrik Dashboard:**
  - Mengubah label "Total Pengguna" menjadi "Total Costumer" dan menyinkronkannya dengan jumlah *customer* riil di database.
  - Memastikan metrik "Total Pesanan" menghitung agregasi seluruh order tanpa memandang status pesanan.
  - Menyinkronkan "Pendapatan" agar merepresentasikan total pendapatan dari *sales* yang berhasil.
  - Mengimplementasikan logika untuk metrik "Peringatan Stok" yang secara otomatis mengidentifikasi produk dengan sisa stok di bawah 1.
  - Menambahkan modul "Aktivitas Terbaru" (Recent Activities) untuk melacak histori transaksi dan *replenishment* stok.
- **Pelaporan Penjualan (Sales Audit):** Membuat serta memverifikasi fungsi ekspor data penjualan bulanan untuk memudahkan proses audit bisnis.

## 2. Perbaikan Logika Otentikasi Admin (13:06 - 16:26 WIB)
Fase ini berfokus pada penyelesaian insiden gagal login (kendala aksesibilitas) pada Dashboard Admin.

**Perubahan yang dilakukan:**
- **Diagnosa dan Fix "Email or Password incorrect":** Memperbaiki bug yang menyebabkan admin tidak bisa login meski kredensial yang dimasukkan sudah benar.
- **Validasi AuthService:** Melakukan verifikasi dan perbaikan terhadap *credential handling* di dalam `AuthService`, khususnya memastikan logika komparasi *hashing* password sudah berjalan dengan baik melawan *state* di database.
- **Resolusi Konflik Filter Keamanan:** Mengatasi terjadinya bentrok (konflik) antara mekanisme *rate-limiting*, *security filters* (`SecurityConfig`), dengan *sequence* login utama.
- **Persistensi Sesi:** Memperbaiki pengelolaan *token* otentikasi di sisi Frontend dan Backend untuk memastikan sesi administratif tetap bertahan (tidak mudah *logout* secara tak terduga) setelah berhasil masuk.

## 3. Implementasi Strategi Unit Testing (16:40 - 17:00 WIB)
Pada pengerjaan terakhir di sore hari, fokus dialihkan ke pemeliharaan stabilitas *backend* dan mencegah munculnya *regression bugs*.

**Perubahan yang dilakukan:**
- **Inisiasi Framework Testing:** Membangun *test suite* dan kerangka unit test yang tangguh untuk backend (Spring Boot) menggunakan framework **JUnit 5** dan **Mockito**.
- **Pengujian Komponen Krusial:** Menulis dan menjalankan unit test untuk komponen/servis backend paling vital yang mencakup `OrderService`, `AuthService`, dan `AuditService`.
- **Penerapan Standar "Given-When-Then":** Menggunakan struktur *Given-When-Then* dalam menyusun *test cases* untuk memvalidasi alur logika bisnis seperti kalkulasi harga, keamanan otentikasi, dan keutuhan data *database*.
- **Verifikasi Alur Operasional:** Melakukan pengecekan *test coverage* pada *workflow* kunci (khususnya yang menangani *order processing* dan *data reporting*) untuk memberikan jaminan keandalan sebelum sistem di-*deploy*.

---
*Dokumentasi ini di-generate secara otomatis berdasarkan riwayat sesi pengembangan sistem (Git changes & riwayat aktivitas) pada tanggal yang bersangkutan.*
