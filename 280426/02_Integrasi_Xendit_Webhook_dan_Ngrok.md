# Dokumentasi Integrasi Xendit Webhook & ngrok
**Tanggal**: 28 April 2026
**Status**: Berhasil Terpasang (Verified 200 OK)

## 1. Konfigurasi ngrok
Untuk mengekspos server lokal ke internet agar bisa menerima callback dari Xendit:
- **Authtoken**: Terkonfigurasi di `backend/ngrok.yml`.
- **Port**: 8321 (Disesuaikan dengan `SERVER_PORT` di `.env`).
- **Command**: `ngrok http 8321` atau `ngrok start --all` jika menggunakan config file.
- **Public URL**: `https://luminance-jolly-ruckus.ngrok-free.dev`

## 2. Konfigurasi Dashboard Xendit
Masukkan URL berikut pada menu **Settings > Callbacks > Invoices**:
- **Invoice Paid (Faktur Dibayar)**: `https://luminance-jolly-ruckus.ngrok-free.dev/api/v1/payments/webhook`
- **Invoice Expired (Faktur Kedaluwarsa)**: `https://luminance-jolly-ruckus.ngrok-free.dev/api/v1/payments/webhook`

## 3. Catatan Teknis & Keamanan
- **Verification**: Backend memverifikasi header `x-callback-token` yang dikirim oleh Xendit.
- **Robustness**: 
    - Penanganan *test payload* (format `demo_...`) telah ditambahkan agar sistem tidak error 500.
    - Penanganan nilai `null` pada payload Xendit untuk menghindari `NullPointerException`.
- **Logging**: Setiap webhook yang masuk dicatat di terminal VS Code dan tabel `PaymentLogs` untuk keperluan audit.
