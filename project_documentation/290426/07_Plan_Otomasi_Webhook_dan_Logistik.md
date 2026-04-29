# Plan dan Rundown: Otomasi Webhook Xendit & Logistik (Binderbyte)

Dokumen ini menjelaskan langkah-laki perbaikan untuk otomatisasi status pembayaran dan otomatisasi pembuatan nomor resi (shipping) agar admin tidak perlu melakukan input manual.

## 1. Analisa Masalah & Solusi

### A. Webhook Xendit Tidak Update Otomatis
*   **Gejala**: Pembayaran di Xendit sukses, tapi status di aplikasi tetap "Pending".
*   **Solusi**: 
    1.  **Logging Agresif**: Menambahkan log detail pada `PaymentService` untuk melihat apakah request dari Xendit benar-benar sampai ke server.
    2.  **Verification Check**: Memastikan `XENDIT_CALLBACK_TOKEN` di `.env` sinkron dengan Dashboard Xendit.
    3.  **Local Testing Tool**: Membuat script simulasi webhook untuk memastikan logic `processXenditWebhook` sudah benar tanpa harus menunggu callback asli.

### B. Otomasi Nomor Resi (Logistik)
*   **Kebutuhan**: Admin tidak ingin mengetik nomor resi. Resi harus muncul otomatis.
*   **Solusi**: 
    1.  **Simulasi Booking**: Karena Binderbyte adalah tracker, kita akan membuat "Mock Booking Engine" yang mensimulasikan pemesanan kurir.
    2.  **Trigger Otomatis**: Saat Admin klik "Proses Pesanan", sistem akan meng-generate nomor resi unik (format: `OTK-JNE-XXXXX`) dan langsung mengubah status ke `Shipped`.
    3.  **Integrasi Binderbyte**: Nomor resi yang dihasilkan akan dibuat agar kompatibel dengan fitur "Lacak" di sisi Customer.

---

## 2. Rencana Perubahan (Proposed Changes)

### Backend (Java/Spring Boot)

1.  **`PaymentService.java`**:
    *   Tambahkan `System.out.println` untuk mencatat setiap webhook yang masuk (Header & Body).
    *   Perbaiki validasi `external_id` agar lebih fleksibel terhadap payload simulasi Xendit.

2.  **`OrderService.java`**:
    *   Buat method `processAutomatedShipping(Integer orderId)`.
    *   Method ini akan menghasilkan nomor resi secara otomatis berdasarkan kurir yang dipilih user saat checkout.
    *   Update status ke `Shipped` secara atomik.

3.  **`PaymentController.java`**:
    *   Tambahkan endpoint sementara `/api/v1/payments/simulate-webhook` (hanya untuk Dev) agar user bisa mentrigger update status secara manual jika ngrok bermasalah.

### Frontend (React/Vite)

1.  **`AdminOrders.jsx`**:
    *   Ubah tombol "Terima & Proses" menjadi "Proses & Kirim Otomatis".
    *   Hapus modal "Input Nomor Resi" karena resi akan di-handle oleh sistem.

---

## 3. Rundown Eksekusi

| Tahap | Aktivitas | Target File |
| :--- | :--- | :--- |
| **Tahap 1** | **Fix Webhook Logging** | `PaymentService.java`, `PaymentController.java` |
| **Tahap 2** | **Otomasi Resi Backend** | `OrderService.java`, `OrderController.java` |
| **Tahap 3** | **UI Update Admin** | `AdminOrders.jsx`, `AdminDashboard.jsx` |
| **Tahap 4** | **Testing & Verifikasi** | - |

---

## 4. Instruksi Verifikasi untuk User

1.  **Cek ngrok**: Pastikan ngrok berjalan di port 8321 dan URL-nya sudah di-update di Dashboard Xendit (Settings > Callbacks).
2.  **Cek Token**: Pastikan `X-Callback-Token` di Xendit sama dengan `XENDIT_CALLBACK_TOKEN` di file `.env`.
3.  **Coba Order**:
    *   Checkout produk.
    *   Bayar di Xendit.
    *   Cek apakah status di Admin Dashboard berubah menjadi **"Waiting_Verification"** secara otomatis.
    *   Klik "Proses & Kirim" di Admin, lalu cek apakah Nomor Resi muncul tanpa Anda ketik.
