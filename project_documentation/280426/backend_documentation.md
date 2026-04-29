# Dokumentasi Backend (28 April 2026)

Dokumen ini merangkum seluruh perubahan dan implementasi di sisi backend yang dilakukan pada tanggal 28 April 2026.

## 1. Otomatisasi Alur Pesanan (Order Flow)
- **Timeout Pembayaran**: Implementasi `OrderTimeoutScheduler` menggunakan Spring Scheduler untuk mengubah status pesanan menjadi `Cancelled` secara otomatis jika tidak dibayar dalam waktu 15 menit.
- **Sinkronisasi Pengiriman**: Implementasi `ShippingSyncScheduler` yang terintegrasi dengan API Binderbyte untuk melacak status pengiriman secara real-time. Jika status terdeteksi `delivered`, sistem akan memberikan sinyal untuk audit penyelesaian.
- **Otomatisasi Resi**: Alur input resi manual dihilangkan dan diganti dengan otomasi sistem saat admin memproses pesanan.

## 2. Integrasi Payment Gateway (Xendit)
- **Webhook Integration**: Implementasi endpoint webhook `/api/v1/payments/webhook` untuk menerima callback pembayaran dari Xendit.
- **Keamanan Webhook**: Penambahan verifikasi header `x-callback-token` untuk memastikan validitas data yang dikirim oleh Xendit.
- **Robustness**: Penanganan *test payload* (demo) dan pencegahan `NullPointerException` pada data callback yang tidak lengkap.
- **Audit Logs**: Pencatatan setiap aktivitas webhook ke dalam tabel `PaymentLogs`.

## 3. Manajemen Audit & Pelaporan
- **Audit Penjualan**: Pembuatan `AuditService` dan `AuditController` dengan endpoint `GET /api/v1/audit/sales` untuk menarik data transaksi bulanan.
- **DTO Baru**: Implementasi `SalesAuditResponseDTO` untuk standarisasi format data laporan penjualan.
- **Filter Status**: Pembaruan logika di `OrderRepository` (`findFilteredOrders`) agar status `Cancelled`, `Rejected`, dan `Expired` dikelompokkan dengan benar dalam filter pembatalan.

## 4. Struktur Database & Model
- **Tabel Baru**:
    - `Invoices`: Untuk menyimpan record invoice resmi setiap transaksi.
    - `PaymentProofs`: Untuk menyimpan bukti pembayaran digital dari Xendit serta bukti pengiriman.
- **Order Tracking**: Pembaruan di `OrderService` untuk memastikan setiap transisi status pesanan tercatat dengan detail di tabel tracking untuk keperluan audit.

---
*Dokumen ini disusun untuk memberikan gambaran teknis mengenai perkembangan backend pada periode terkait.*
