# Rundown Pengerjaan Fitur Order Flow & Otomatisasi

Dokumen ini berisi rencana kerja mendetail untuk implementasi alur pesanan (Order Flow) dari tahap Checkout hingga Selesai sesuai dengan instruksi yang diberikan.

---

## 1. Tahap Persiapan & Analisis Sistem
*   **Identifikasi Status Saat Ini**: 
    *   `Pending`: Belum Bayar (Kotak Kuning).
    *   `Waiting_Verification`: Menunggu Konfirmasi Admin (Kotak Biru).
    *   `Processing`: Pesanan diproses (Perlu Input Resi).
    *   `Shipped`: Barang dalam pengiriman (Kotak Hijau).
    *   `Completed`: Barang sampai & Selesai (Kotak Putih).

---

## 2. Detail Implementasi

### Fitur Kotak KUNING (Timeout 15 Menit)
*   **Logika**: Jika pesanan tidak dibayar dalam 15 menit, status otomatis berubah menjadi `Cancelled`.
*   **Teknis**: Menggunakan Spring Scheduler `OrderTimeoutScheduler`.

### Fitur Kotak BIRU & Admin Menu
### Admin Menu (Manajemen Pesanan)
1.  **Tab Validasi Pembayaran**: 
    *   Tampilkan data dari Xendit (seperti `External ID`, `Amount`, dan `Payment Method`) sebagai bukti pembayaran yang sah.
2.  **Hapus Tab Perlu Input Resi**:
    *   Alur input resi manual dihapus dan diganti dengan otomasi saat admin menekan tombol "Proses & Kirim".

### Fitur Kotak HIJAU (Real-time Tracking)
*   **Logika**: Sinkronisasi status pengiriman dengan API Binderbyte.
*   **Teknis**: Menggunakan `ShippingSyncScheduler` untuk mengecek status `delivered` secara real-time.

### Fitur Kotak PUTIH (Audit Admin)
*   **Logika**: Konfirmasi barang sampai kini dilakukan oleh Admin untuk kepentingan audit toko.
*   **Teknis**: Tombol "Konfirmasi Selesai (Audit)" muncul di Dashboard Admin saat Binderbyte mendeteksi status `delivered`.
