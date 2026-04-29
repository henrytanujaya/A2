# Analisis & Plan: Sistem Pembayaran & Verifikasi Admin

Analisis pada alur pembayaran menemukan adanya kendala pada sinkronisasi status antara Admin dan User, serta bug pada saat refresh halaman invoice.

## 1. Verifikasi Admin & Update UI Real-time
**Masalah**: User tidak tahu kapan admin sudah memverifikasi kecuali mereka melakukan refresh manual.
**Rencana Solusi**:
- **Polling Status**: Di halaman `InvoiceReceipt.jsx`, jika status saat ini adalah `WAITING`, jalankan `setInterval` setiap 10 detik untuk memanggil API `/api/v1/orders/{id}`.
- **Auto-Update**: Begitu status berubah menjadi `Processing` atau `Shipped` (Lunas), hentikan polling dan perbarui UI secara otomatis (tampilkan pesan sukses dan nomor resi jika ada).
- **Notification**: Tambahkan push notification atau toast sederhana saat status berubah.

## 2. Bug Refresh (F5) Halaman Invoice
**Analisis Bug**: 
- Saat refresh, `location.state` hilang, sehingga aplikasi melakukan fetch ulang ke API.
- Jika API mengembalikan status lama (`Pending`), maka UI akan kembali menunjukkan "Belum Dibayar" meskipun admin sudah memvalidasi.
- Kemungkinan penyebab: **Browser Caching** atau **Delayed DB Persistence**.

**Rencana Perbaikan**:
- **Frontend Fix**: Tambahkan header `Cache-Control: no-cache` saat memanggil API detail order di `useEffect`.
- **Backend Fix**: Pastikan controller order tidak menggunakan cache level hibernate yang persisten jika data sering berubah status.
- **Redirection Logic**: Jika setelah fetch ulang status ternyata memang sudah berubah, pastikan `mappedInvoice` di frontend mencerminkan status terbaru dari database secara akurat.

## 3. Alur Verifikasi Admin
- Admin menekan tombol "Validasi Pembayaran".
- Backend mengubah status Order menjadi `Processing`.
- Backend mencatat riwayat di `OrderTracking` ("Pembayaran Dikonfirmasi").
- User yang sedang membuka invoice (dengan sistem Polling) akan langsung melihat perubahan status menjadi "LUNAS".

---

**Catatan Integrasi Xendit**: Sebagian besar verifikasi status ini akan diotomatisasi melalui Webhook Xendit, namun fitur polling tetap diperlukan untuk fallback dan update UI instan.

## 4. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **API Status Check**: Endpoint GET `/api/v1/orders/{id}` yang efisien dan mengembalikan status terbaru langsung dari database utama (bukan cache yang stale).
2. **Frontend Polling Logic**: Penggunaan `useEffect` dengan `setInterval` dan pembersihan interval (cleanup function) untuk mencegah memory leak.
3. **Cache-Control Header**: Pengaturan header HTTP pada response backend atau request frontend untuk menghindari caching pada data sensitif status order.
4. **Toast/Notification Library**: Library seperti `react-hot-toast` atau `react-toastify` untuk memberikan feedback visual saat status berubah.