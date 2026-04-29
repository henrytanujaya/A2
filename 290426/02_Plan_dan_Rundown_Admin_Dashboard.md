# Plan dan Rundown: Pembaruan Admin Dashboard & Export Data

Berdasarkan analisis dari permintaan Anda, berikut adalah rancangan implementasi dan rundown yang akan dikerjakan untuk memenuhi 3 poin yang diminta.

## Analisis Mendalam

1. **Pagination di Admin (10 data per view)**:
   - Saat ini, pagination di `AdminOrders.jsx` di-set menjadi `pageSize = 25`. Kita perlu mengubahnya menjadi 10.
   - Tidak ada pagination lain yang didefinisikan secara statis di halaman admin lainnya (seperti AdminStock) yang memerlukan perubahan ini, sehingga fokus utama hanya pada Order Admin.

2. **Pembaruan Data di Dashboard Admin (`AdminDashboard.jsx`)**:
   - Tampilan saat ini masih menggunakan data _hardcoded_. Kita perlu menghubungkannya dengan API backend.
   - **Kotak Total Costumer**: Kita akan menghitung jumlah _user_ dengan _role_ `Customer` dari tabel `Users`.
   - **Kotak Total Pesanan**: Kita akan menghitung total semua pesanan di tabel `Orders` tanpa mempedulikan status.
   - **Kotak Pendapatan**: Total pendapatan akan dihitung berdasarkan akumulasi `totalAmount` dari _Orders_ dengan status yang menandakan penjualan sukses (seperti `Paid`, `Processing`, `Shipped`, `Completed`).
   - **Kotak Peringatan Stok**: Menghitung jumlah produk di tabel `Products` yang _stock_ nya kurang dari 1.
   - **Kotak Aktivitas Terbaru**: Kita akan mengambil 5 data pesanan terbaru dari tabel `Orders` untuk ditampilkan di area ini, menggantikan teks placeholder. (Bisa juga ditambahkan log re-stok jika diperlukan, namun untuk saat ini 5 pesanan terbaru akan mencakup aktivitas penjualan).

3. **Sistem Export Data Penjualan**:
   - Fitur "Export Excel" pada halaman `SalesAudit.jsx` (Audit Penjualan) saat ini sudah menggunakan library `xlsx` dan `file-saver`.
   - Sistem sudah mem-filter berdasarkan bulan dan tahun untuk memanggil data dari backend API `/api/v1/audit/sales`.
   - Kode _export_ sudah sesuai standar dan bisa berjalan dengan baik. Kita akan memastikannya dan menguji fungsionalitasnya di akhir pekerjaan.

---

## Pertanyaan / Butuh Review User

1. **Definisi "Pendapatan"**: Pada perhitungan Pendapatan (Total Penjualan), saya berencana menghitung total pesanan yang berstatus sukses (`Paid`, `Processing`, `Shipped`, `Completed`). Apakah Anda setuju dengan filter ini? Ataukah semua pesanan terlepas dari status (termasuk dibatalkan) harus dihitung? Standarnya adalah pesanan yang sudah dibayar/berhasil. ✅

2. **Aktivitas Terbaru**: Area ini akan saya isi dengan tabel "5 Pesanan Terbaru" agar admin dapat memantau pesanan yang masuk secara real-time. Jika Anda ingin riwayat "Re-stok produk" (seperti produk yang baru ditambah jumlahnya) juga muncul di tabel yang sama, kita bisa menggabungkannya. Apakah Anda lebih memilih (1) Hanya 5 Pesanan Terbaru, atau (2) Gabungan Pesanan Terbaru + Riwayat Re-stok? (Untuk sekarang di _plan_ saya asumsikan opsi 1 yang lebih cepat diimplementasikan). nomor 2 ✅

---

## Proposed Changes (Rencana Perubahan File)

### Backend (Spring Boot)

1. **`OrderRepository.java`**: Menambahkan _query_ untuk menghitung Total Pendapatan dan pesanan terbaru.
2. **`UserRepository.java`**: Menambahkan *method* `countByRoleIgnoreCase` untuk menghitung total *Costumer*.
3. **`ProductRepository.java`**: Menambahkan *method* `countByStockQuantityLessThan` untuk peringatan stok.
4. **`AdminDashboardService.java` (BARU)**: Membuat `AdminDashboardService` yang akan menggabungkan semua kueri dari repository di atas menjadi satu objek balasan.
5. **`AdminDashboardController.java` (BARU)**: Membuat *controller* baru (`/api/v1/admin/dashboard`).

### Frontend (React / Vite)

1. **`AdminOrders.jsx`**: Mengubah variabel `const pageSize = 25;` menjadi `const pageSize = 10;`.
2. **`AdminDashboard.jsx`**:
   - Mengganti teks `Total Pengguna` menjadi `Total Costumer`.
   - Menambahkan integrasi API.
   - Me-_render_ _state_ dari hasil API ke kotak statistik.
   - Membangun tabel dinamis di bagian "Aktivitas Terbaru".

---

## Verification Plan (Rundown Pengerjaan)

1. **Implementasi Backend:**
   - Menyelesaikan semua *query* repositori.
   - Menyelesaikan servis dan kontroller.
   - *Restart* backend.

2. **Implementasi Frontend:**
   - Memperbaiki `AdminOrders.jsx` (Pagination).
   - Membangun antarmuka dinamis pada `AdminDashboard.jsx`.
   - *Hot-reload* Frontend berjalan otomatis.

3. **Verifikasi Terakhir:**
   - Buka halaman Dashboard Admin. Pastikan keempat kotak statistik memuat data _real_ dari database.
   - Buka halaman Pesanan Admin (`AdminOrders.jsx`). Pastikan jumlah data maksimal 10 per halaman.
   - Buka halaman Audit Penjualan (`SalesAudit.jsx`). Lakukan Export to Excel, pastikan file `.xlsx` berhasil diunduh dan struktur datanya sesuai dengan format bulan/tahun yang dipilih.
