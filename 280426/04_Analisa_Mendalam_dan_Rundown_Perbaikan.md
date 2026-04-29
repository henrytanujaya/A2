# Dokumentasi & Rundown Perbaikan Sistem (28-04-2026)

Berdasarkan hasil testing end-to-end, berikut adalah rencana perbaikan dan integrasi sistem.

## 1. Perbaikan UI Invoice & Cart
*   **Invoice**:
    *   Mengubah teks tombol "Ke Profil" menjadi **"Kembali"**.
    *   Mengubah logika tombol untuk kembali ke halaman sebelumnya menggunakan `useNavigate(-1)`.
    *   Mengubah fitur "Print" menjadi **"Download"** yang menyimpan file gambar/PDF langsung ke storage user (menggunakan `html2canvas`).
*   **Cart**:
    *   Menampilkan detail jumlah (quantity) item untuk setiap produk di daftar keranjang.

## 2. Automasi Flow Pembayaran & Pengiriman (End-to-End)
Flow akan diperbarui menjadi lebih otomatis dan terdokumentasi:
1.  **Checkout**: Status `Pending`, user diarahkan ke "Pesanan Saya".
2.  **Pembayaran**: User membayar via Xendit -> Webhook mengupdate status ke `Waiting_Verification`.
3.  **Bukti Pembayaran**: Xendit mengirim bukti yang akan ditampilkan di tab "Validasi Pembayaran" Admin dan disimpan di database untuk audit.
4.  **Konfirmasi Admin**: Admin memvalidasi pembayaran -> Status berubah ke `Processing` -> User dapat popup "Pembayaran Berhasil" dan pindah ke tab "Pengiriman".
5.  **Pengiriman**: API Shipping memberikan bukti resi (status proses) -> Admin mengupdate jika sudah terkirim.
6.  **Barang Sampai**: User mendapat popup "Barang Sudah Sampai" -> Pesanan pindah ke tab "Selesai".
7.  **Audit Akhir**: Admin mengonfirmasi penyelesaian untuk audit toko -> Pesanan masuk ke "Completed" dengan bukti Xendit & Invoice tersimpan.

## 3. Pembaruan Database & API
*   **Tabel Baru**:
    *   `Invoices`: Menyimpan record invoice resmi.
    *   `PaymentProofs`: Menyimpan bukti pembayaran Xendit dan bukti pengiriman.
*   **API Integrasi**:
    *   Menambahkan endpoint untuk mengambil bukti pembayaran dan pengiriman.
    *   Memperbarui endpoint Audit Penjualan agar sinkron dengan database.

## 4. Rundown Pekerjaan

| No | Tugas | Status | Target |
|----|-------|--------|--------|
| 1 | Update UI Invoice (`Kembali`, `Download`) | ✅ Done | Frontend |
| 2 | Update UI Cart (Detail Quantity) | ✅ Done | Frontend |
| 3 | Update Schema Database (`Invoices`, `PaymentProofs`) | ✅ Done | Backend (SQL Server) |
| 4 | Implementasi Logic Flow Baru di `OrderService` | ✅ Done | Backend |
| 5 | Update Tab & Popup di `UserOrders.jsx` | ✅ Done | Frontend |
| 6 | Tambah Fitur Bukti di `AdminOrders.jsx` | ✅ Done | Frontend |
| 7 | Fix Integrasi Menu Audit Penjualan | ✅ Done | Backend & Frontend |
| 8 | Final Testing & Validasi | ✅ Done | End-to-End |

---
*Dokumentasi ini dibuat secara otomatis sebagai panduan pengerjaan perbaikan sistem.*
