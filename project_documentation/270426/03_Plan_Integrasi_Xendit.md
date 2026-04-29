# Plan Integrasi Xendit Payment Gateway

## 1. Tujuan
Menggantikan sistem pembayaran mock dengan **Xendit** untuk mendukung metode pembayaran real (VA, E-Wallet, Kartu Kredit, QRIS, Retail Outlets).

## 2. Langkah-Langkah Teknis (Backend)

### A. Konfigurasi
1. Tambahkan dependensi `xendit-java` di `pom.xml` (Opsional, bisa menggunakan `RestTemplate` atau `WebClient` untuk fleksibilitas).
2. Tambahkan properti di `application.properties`:
   ```properties
    xendit.api-key=xnd_development_kCHlFnBu9vmObELqkdzbBfjbFNoiDJxUGSvHrRS2DOyiLXjWnfw5eZ9OIbxL6n
    xendit.callback-token=TakCix3A3SSJsL9YOAVcfbIUwIncbMkxgBjVX0v10J0NB1nV
    xendit.webhook-url=https://yourdomain.com/api/payments/webhook
    ```

### B. Implementasi `PaymentService.java`
1. **Create Invoice**:
   - Ganti logic `createPaymentToken` untuk memanggil API `/v2/invoices`.
   - Payload: `external_id` (Order ID), `amount`, `payer_email`, `description`.
   - Simpan `invoice_id` dari Xendit ke database (tabel `Orders` atau tabel baru `Payments`).
2. **Handle Webhook**:
   - Perkuat `processPaymentNotification` untuk memverifikasi `x-callback-token` dari header.
   - Update status Order berdasarkan `status` dari payload Xendit (`PAID`, `EXPIRED`, `SETTLED`).

### C. Update `PaymentController.java`
- Buat endpoint POST `/api/payments/webhook` yang terbuka (tanpa JWT auth) khusus untuk menerima callback dari IP Xendit.

---

## 3. Langkah-Langkah Teknis (Frontend)

### A. Halaman Checkout
- Setelah klik "Bayar", panggil API backend untuk mendapatkan `invoice_url`.
- Redirect pengguna ke `invoice_url` (atau buka di modal/iframe).

### B. Halaman Invoice/Success
- Siapkan halaman `InvoiceReceipt.jsx` untuk mengecek status pembayaran ke backend setelah user kembali dari Xendit.

---

## 4. Alur Kerja (Workflow)
1. **User** -> Klik "Place Order" -> **Backend** simpan Order (Pending).
2. **Backend** -> Request Invoice ke **Xendit**.
3. **Xendit** -> Kembalikan `invoice_url`.
4. **User** -> Bayar di halaman Xendit.
5. **Xendit** -> Kirim Webhook ke **Backend**.
6. **Backend** -> Update status Order menjadi `Paid`.
7. **Frontend** -> Menampilkan status Berhasil.

---

## 5. Keamanan
- **IP Whitelisting**: Hanya terima webhook dari IP Xendit.
- **Signature Verification**: Verifikasi `callback-token`.
- **Idempotency**: Pastikan satu webhook hanya diproses satu kali.

---

## 6. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **Akun Xendit Aktif**: API Key dan Callback Token sudah tersedia.
2. **Webhook URL Publik**: Server backend harus bisa diakses secara publik (atau menggunakan `ngrok` saat development) agar Xendit bisa mengirim callback.
3. **Konfigurasi SSL**: Disarankan menggunakan HTTPS untuk endpoint webhook demi keamanan data.
4. **Database Migration**: Menambahkan kolom `payment_invoice_id` dan `payment_status` pada tabel `Orders`.

