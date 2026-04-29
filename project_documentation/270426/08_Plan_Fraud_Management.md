# Plan: Fraud Management System (Keamanan Pembayaran)

Analisis pada sistem pembayaran menunjukkan perlunya lapisan keamanan tambahan untuk melindungi platform dari transaksi palsu, serangan brute-force payment, dan manipulasi data pembayaran.

## 1. Tujuan
Mencegah kerugian finansial akibat transaksi ilegal, menjaga integritas data status order, dan memastikan setiap pembayaran divalidasi oleh sumber yang sah (Xendit).

## 2. Rencana Implementasi

### A. Keamanan Webhook (Signature Verification)
- **Masalah**: Endpoint webhook bersifat publik. Tanpa verifikasi, siapa pun bisa mengirim data palsu yang menyatakan "Order Lunas".
- **Solusi**: 
    - Implementasikan verifikasi `X-CALLBACK-TOKEN` yang dikirim oleh Xendit di header.
    - Cocokkan token tersebut dengan secret token yang tersimpan aman di environment variable backend.
    - Tolak request (401 Unauthorized) jika token tidak cocok.

### B. Idempotency (Pencegahan Duplikasi)
- **Masalah**: Gangguan jaringan bisa menyebabkan webhook dikirim berulang kali atau user menekan tombol bayar berkali-kali.
- **Solusi**:
    - Gunakan `external_id` (Order ID) sebagai kunci unik.
    - Sebelum memproses status "Lunas", cek apakah status di database sudah "Paid". Jika sudah, abaikan request berikutnya (Idempotent).

### C. Rate Limiting & Velocity Checks
- **Masalah**: Serangan "Carding" di mana bot mencoba ribuan nomor kartu kredit dalam waktu singkat.
- **Solusi**:
    - Optimalkan **Bucket4j** di Spring Boot untuk membatasi request ke endpoint `/api/payments/create`.
    - Batasi maksimal 3 percobaan pembayaran per user dalam kurun waktu 10 menit.

### D. Audit Logging (Jejak Digital)
- **Masalah**: Sulit melacak penyebab perubahan status jika terjadi perselisihan data.
- **Solusi**:
    - Simpan log setiap kali status order berubah (Pending -> Waiting -> Paid).
    - Catat IP Address, User Agent, dan Payload asli dari Xendit ke dalam tabel `PaymentLogs`.

## 3. Alur Kerja Keamanan
1. **Request Pembayaran**: Backend cek limit user (Bucket4j) -> Buat Invoice di Xendit.
2. **Webhook Masuk**: Backend verifikasi Signature/Token -> Cek status saat ini di DB.
3. **Validasi Data**: Backend pastikan `amount` yang dibayar sama persis dengan `finalAmount` di database.
4. **Update & Log**: Update status order -> Simpan bukti transaksi (log) -> Kirim notifikasi.

---

## 4. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **Xendit Callback Token**: Sudah tersedia (`TakCix3A3...`).
2. **Database Table `payment_logs`**: Untuk menyimpan riwayat transaksi dan payload asli untuk keperluan audit.
3. **SSL/HTTPS**: Wajib diaktifkan agar token webhook tidak bisa di-intercept di tengah jalan.
4. **Environment Variable**: `XENDIT_CALLBACK_TOKEN` yang disimpan secara aman (bukan hardcoded).
