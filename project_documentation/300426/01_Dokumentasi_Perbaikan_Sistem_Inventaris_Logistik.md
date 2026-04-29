# Dokumentasi Perbaikan Sistem Inventaris, Logistik, dan Sinkronisasi UI
**Tanggal**: 30 April 2026

Dokumen ini berisi rangkuman seluruh perbaikan dan optimasi sistem yang telah dilakukan dalam 12 jam terakhir, berfokus pada integrasi logistik, manajemen stok dua-arah (Admin dan Customer), serta perbaikan bug kalkulasi pesanan.

---

## 1. Perbaikan Backend (API & Logika Bisnis)

### A. Optimasi Integrasi Logistik (Biteship)
- **File**: `BiteshipService.java`
- **Perbaikan**: Menambahkan penanganan (patch) untuk data pelanggan yang tidak memiliki nomor telepon atau nama. Sistem kini secara otomatis menyisipkan nomor *dummy* (`080000000000`) sebelum mengirim payload ke API Biteship untuk mencegah terjadinya error `400 Bad Request`.
- **Peningkatan Logging**: Menambahkan deteksi `HttpStatusCodeException` untuk menangkap dan mencatat pesan error spesifik dari API Biteship, sehingga proses *debugging* menjadi jauh lebih mudah.

### B. Simulasi Pelacakan untuk Demo Client
- **File**: `TrackingService.java`
- **Perbaikan**: Menambahkan logika pemrosesan data *mock* untuk mengenali *prefix* nomor resi `WYB-` dan `BSTST-`. Sistem sekarang dapat menstimulasikan pengiriman sukses (status `DELIVERED`) secara instan.
- **File**: `ShippingSyncScheduler.java`
- **Perbaikan**: Mengubah interval pengecekan status pengiriman otomatis dari 10 menit menjadi **5 detik**. Hal ini memastikan perpindahan status ke *Delivered* terlihat instan saat presentasi/demo.

### C. Konsistensi Stok (Bugfix OrderService)
- **File**: `OrderService.java`
- **Perbaikan**: Menemukan dan memperbaiki kelemahan kritis di mana stok barang hilang (tidak dikembalikan) ketika Admin menolak (`Rejected`) atau membatalkan pesanan. 
- **Logika Baru**: Menambahkan fungsi restorasi stok (`productRepository.increaseStock`) ke dalam metode `updateOrderDetails` apabila status pesanan diubah ke `Rejected` atau `Cancelled`. Hal ini menjamin konsistensi stok 100% dan mencegah hilangnya nilai aset inventaris.

---

## 2. Perbaikan Frontend (UI/UX & Integrasi)

### A. Migrasi & Dinamisasi AdminStock
- **File**: `AdminStock.jsx`
- **Perbaikan**: Menghapus data *hardcoded* dan menghubungkannya langsung ke REST API `GET /api/v1/products`.
- **Fitur Baru**: Menambahkan logika `handleSave` yang mendeteksi perubahan angka stok oleh Admin dan mengirimkannya via API `PATCH /api/v1/products/{id}/stock` secara *batch*.
- **UI/UX**: Input stok kini akan berubah menjadi warna kuning (`#f1c40f`) ketika Admin mengubah angka namun belum menekan tombol Simpan, memberikan indikasi visual yang jelas tentang data mana yang *pending*.

### B. Sinkronisasi Katalog Real-Time (Auto-Polling)
- **File**: `Manga.jsx`, `Merchandise.jsx`, `Home.jsx`
- **Perbaikan**: Katalog sisi Customer awalnya statis dan tidak merefleksikan perubahan stok terbaru jika halaman tidak direfresh secara manual.
- **Fitur Baru**: Menerapkan mekanisme **Auto-Polling** (`setInterval`) yang mengambil data produk terbaru setiap **3 detik**. Perubahan stok akibat modifikasi Admin atau pembelian (*Checkout*) dari *user* lain kini langsung terlihat di layar secara *real-time*.

### C. Perbaikan Bug Kalkulasi Total Keranjang
- **File**: `Cart.jsx`
- **Perbaikan**: Mengoreksi perhitungan `Ringkasan Belanja` yang sebelumnya hanya menjumlahkan "Harga Satuan" tanpa mengalikannya dengan Kuantitas produk.
- **Logika Baru**: `total = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);`
- Hasilnya, estimasi total yang ditampilkan di dalam keranjang kini akurat dan sesuai dengan tagihan sesungguhnya pada layar Checkout.

---

**Kesimpulan:**
Sistem *e-commerce* sekarang memiliki pondasi yang kokoh dalam mencegah *overselling*, memastikan stok selalu dikembalikan pada status penolakan, serta menyediakan pembaruan visual yang seketika baik bagi pengguna maupun pengelola toko. Demo dapat dieksekusi dengan mulus dengan interval scheduler logistik 5 detik.
