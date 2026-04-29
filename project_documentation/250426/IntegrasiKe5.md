# Dokumentasi & Rundown Integrasi Ke-5: Alur Pembayaran & Validasi Admin

Dokumen ini merangkum perbaikan untuk masalah **403 Forbidden** dan menyusun rundown alur kerja (workflow) dari sisi Customer hingga Admin.

## 1. Analisis Masalah Utama (403 Forbidden)

Terjadi kegagalan otorisasi pada dua titik kritis:
1.  **AdminOrders.jsx**: Gagal mengambil data (`GET /api/v1/orders/all`) karena user yang mengakses tidak memiliki role `Admin`.
2.  **InvoiceReceipt.jsx**: Gagal melakukan sinkronisasi pembayaran (`PATCH /api/v1/orders/1/status`) karena endpoint update status diproteksi khusus untuk `Admin`.

---

## 2. Rundown Perbaikan Alur Kerja (End-to-End)

Berikut adalah rundown untuk menciptakan alur: **Pilih Produk > Pengiriman > Pembayaran > Validasi Admin > Invoice Final.**

### Tahap 1: Customer - Checkout & Pembuatan Pesanan
*   **Aksi**: Customer menekan tombol "Place Order" di halaman Checkout.
*   **Backend**: `OrderService.createOrder` dipanggil. 
    *   Status awal diset menjadi `Pending` (Belum Dibayar).
*   **Frontend**: Redirect ke halaman `/invoice/:orderId` dengan status visual **"BELUM DIBAYAR"**.

### Tahap 2: Customer - Proses Pembayaran (Simulasi)
*   **Aksi**: Customer memilih metode pembayaran dan menekan tombol **"Bayar Sekarang"**.
*   **Masalah Saat Ini**: Frontend mencoba update status langsung ke `Processing` via API Admin.
*   **Perbaikan Rundown**: 
    1.  Ubah status target di Frontend menjadi `Waiting_Verification` (Menunggu Verifikasi).
    2.  Ubah Backend agar mengizinkan `Customer` melakukan transisi status dari `Pending` ke `Waiting_Verification`.

### Tahap 3: Admin - Verifikasi & Validasi
*   **Aksi**: User dengan role **Admin** masuk ke dashboard `/admin/orders`.
*   **Backend**: Memperbaiki akses `GET /api/v1/orders/all` agar Admin bisa melihat semua pesanan yang masuk.
*   **Proses Verifikasi**:
    *   Admin mengecek apakah pembayaran sudah masuk (misal cek mutasi bank manual).
    *   Jika **OK**: Admin menekan tombol "Validasi" di dashboard. Status berubah menjadi `Processing`.
    *   Jika **Gagal**: Status tetap `Pending` atau diubah ke `Cancelled`.

### Tahap 4: Customer - Invoice Final
*   **Aksi**: Customer memuat ulang halaman Invoice.
*   **Tampilan**:
    *   Jika sudah divalidasi Admin: Status Invoice berubah menjadi **"LUNAS"**, nomor resi muncul, dan tombol "Lacak Paket" aktif.
    *   Jika belum divalidasi: Status tetap **"BELUM DIBAYAR"** atau **"MENUNGGU VERIFIKASI"**.

---

## 3. Langkah Teknis Perbaikan (Segera Dilakukan Setelah Approval)

### A. Backend (`OrderController.java` & `OrderSecurity`)
1.  Izinkan `Customer` melihat detail order miliknya sendiri (Sudah ada).
2.  Tambahkan izin khusus agar `Customer` bisa mengubah status pesanan miliknya dari `Pending` ke `Waiting_Verification` (untuk simulasi bayar).
3.  Pastikan role `Admin` dapat mengakses `/api/v1/orders/all`.

### B. Frontend (`InvoiceReceipt.jsx` & `AdminOrders.jsx`)
1.  **InvoiceReceipt**: Ubah pemanggilan status dari `Processing` menjadi `Waiting_Verification`.
2.  **AdminOrders**: Tambahkan tombol untuk memvalidasi pembayaran (mengubah status dari `Waiting_Verification` ke `Processing`).

---

## 4. Status Integrasi
- [x] Deteksi Masalah 403 Forbidden
- [ ] Implementasi Transisi Status `Waiting_Verification`
- [ ] Perbaikan Akses Admin Dashboard
- [ ] Uji Coba Alur Baru

**Dokumentasi diperbarui pada: 2026-04-25 19:38**
