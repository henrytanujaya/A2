# Dokumentasi Backend (29 April 2026)

Dokumen ini merangkum seluruh perubahan dan implementasi di sisi backend yang dilakukan pada tanggal 29 April 2026.

## 1. Pengembangan Admin Dashboard API
- **Controller & Service Baru**:
    - `AdminDashboardController`: Menyediakan endpoint `/api/v1/admin/dashboard` untuk kebutuhan data statistik ringkasan dashboard.
    - `AdminDashboardService`: Mengagregasi data dari berbagai repository untuk memberikan gambaran performa bisnis secara real-time.
- **Optimasi Query Repository**:
    - `UserRepository`: Penambahan method `countByRoleIgnoreCase` untuk menghitung total pelanggan aktif.
    - `OrderRepository`: Implementasi kalkulasi total pendapatan (revenue) dari pesanan sukses serta pengambilan data aktivitas transaksi terbaru.
    - `ProductRepository`: Penambahan fungsi `countByStockQuantityLessThan` untuk mendeteksi produk yang kehabisan stok (peringatan stok).

## 2. Keamanan & Otentikasi
- **Perbaikan Login Admin**: Investigasi dan perbaikan pada `AuthService` terkait kegagalan otentikasi. Memastikan logika verifikasi password hashing sinkron dengan data di database.
- **Resolusi Konflik Security**: Penyesuaian pada `SecurityConfig` untuk mengatasi konflik antara *rate-limiting*, filter keamanan, dan urutan proses otentikasi yang menyebabkan error akses.
- **Manajemen Sesi**: Perbaikan pada mekanisme penanganan token JWT untuk memastikan stabilitas sesi login admin.

## 3. Strategi Pengujian (Unit Testing)
- **Setup Framework**: Inisialisasi framework testing menggunakan **JUnit 5** dan **Mockito**.
- **Cakupan Pengujian**:
    - `OrderServiceTest`: Fokus pada validasi kalkulasi harga, logika diskon, dan transisi status pesanan.
    - `AuthServiceTest`: Fokus pada skenario login, registrasi, dan validasi token JWT.
    - `AuditServiceTest`: Fokus pada akurasi perhitungan data laporan keuangan.
- **Metodologi**: Penerapan standar penulisan tes berbasis *Given-When-Then* untuk kejelasan skenario uji.

---
*Dokumen ini disusun untuk memberikan gambaran teknis mengenai perkembangan backend pada periode terkait.*
