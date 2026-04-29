# Plan dan Rundown: Sinkronisasi Flow Order End-to-End

Dokumen ini berisi analisis detail dan rencana implementasi (rundown) untuk mensinkronkan alur pesanan dari checkout hingga selesai, memastikan konsistensi status di sisi Customer dan Admin, serta mengintegrasikan Xendit dan Binderbyte sesuai urutan yang diminta (A-I).

## 1. Analisis Point-Point Permasalahan

### 1.1. Jeda Data (Delay) Bukti Pembayaran dan Pengiriman
*   **Xendit (Pembayaran):** Jeda waktu dari pelanggan membayar hingga sistem menerima notifikasi (webhook) umumnya sangat cepat (real-time, sekitar 1-5 detik). Keterlambatan biasanya hanya terjadi jika ada isu jaringan atau webhook gagal diproses oleh server kita.
*   **Binderbyte (Pengiriman):** Sinkronisasi data pengiriman sangat bergantung pada frekuensi update dari pihak ekspedisi (JNE, SiCepat, dll.) ke Binderbyte. Jeda bisa bervariasi dari *real-time* hingga beberapa jam. Sistem kita membaca data ini melalui API Binderbyte, jadi kita akan menampilkan status paling mutakhir yang tersedia di Binderbyte.

### 1.2. Status Pembayaran di Invoice
*   **Masalah:** Status di Invoice masih menampilkan "Belum Di Bayar" meskipun pembayaran sudah dilakukan.
*   **Penyebab:** Pada file `InvoiceReceipt.jsx`, status "LUNAS" atau "WAITING" saat ini sangat bergantung pada `order.status` secara umum, bukan mengecek spesifik `order.paymentStatus`. Jika order status adalah `Waiting_Verification`, invoice tidak otomatis melabeli "LUNAS", padahal secara teknis uang sudah masuk (terutama via Xendit).
*   **Solusi:** Memperbarui logika di `InvoiceReceipt.jsx` agar mengecek `order.paymentStatus === 'PAID'` untuk langsung menampilkan label "LUNAS" (beserta teks "Menunggu Konfirmasi" seperti yang diinginkan).

### 1.3. Flow Sinkronisasi (Urutan A - I)

Berikut adalah mapping alur (flow) yang diinginkan dan status saat ini/perbaikannya:

*   **[A] Checkout -> Belum Bayar:** 
    *   *Kondisi Saat Ini:* `Checkout.jsx` mengalihkan user ke tab `waiting` (Menunggu Konfirmasi).
    *   *Perbaikan:* Mengubah URL redirect di `Checkout.jsx` (baris 184) menjadi `/my-orders?tab=unpaid`.
*   **[B] Customer Bayar (Xendit) -> Menunggu Konfirmasi:**
    *   *Kondisi Saat Ini:* Webhook Xendit (`PaymentService.java`) mengubah status menjadi `Waiting_Verification` dan UI memindahkan ke tab `waiting`. Ini sudah berjalan, tetapi perlu dipastikan tab "Menunggu Konfirmasi" (di sisi user) sinkron dengan tab "Validasi Bayar" di Admin.
*   **[C] Admin Konfirmasi -> Transaksi Diterima:**
    *   *Kondisi Saat Ini:* Admin memvalidasi (tombol "Proses & Kirim Pesanan" di tab Validasi Bayar). Status berubah ke `Processing`.
    *   *Perbaikan:* Pastikan notifikasi/history tracking memunculkan kata "Transaksi Diterima" agar sesuai ekspektasi.
*   **[D] Popup Customer -> Tab Pengiriman:**
    *   *Kondisi Saat Ini:* Ada popup, tetapi perlu dipastikan setelah user klik "OK", UI langsung memindahkan active tab ke `shipping`.
*   **[E] Admin Kirim Data ke Binderbyte -> Bawa Invoice:**
    *   *Kondisi Saat Ini:* Belum ada integrasi penuh pengiriman resi (create AWB otomatis) ke Binderbyte dari Admin. Admin hanya memasukkan nomor resi secara manual atau otomatis jika simulasi.
    *   *Perbaikan:* Menambahkan fungsionalitas input resi pengiriman (Tracking Number) saat Admin memindahkan pesanan dari `Processing` ke `Shipped`.
*   **[F] Binderbyte "Delivered" -> Admin Konfirmasi:**
    *   *Kondisi Saat Ini:* Ada tombol "Tandai Sampai (Delivered)" manual di sisi Admin. Sistem belum memiliki polling otomatis ke Binderbyte untuk update status ke `Delivered` tanpa intervensi admin.
    *   *Perbaikan:* Tetap pertahankan konfirmasi manual (untuk safety audit) ATAU tambahkan job penjadwalan yang mengecek status Binderbyte secara berkala. Sesuai instruksi "lalu admin akan mengkonfirmasinya", flow manual + tombol verifikasi sudah tepat.
*   **[G] Pindah ke Tab Selesai:**
    *   *Kondisi Saat Ini:* Admin memindahkan status ke `Completed`. Di sisi customer, `Completed` dan `Delivered` masuk ke tab "Selesai ✨". Ini sudah sesuai.
*   **[H] Audit di Tab Completed:**
    *   *Kondisi Saat Ini:* Di `AdminOrders.jsx`, pesanan di tab `Completed` bisa melihat bukti "Xendit" dan "Shipping". Ini sudah diimplementasikan.
*   **[I] Flow Selesai.**

---

## 2. Rundown Perbaikan (Langkah Eksekusi)

Berikut adalah langkah-langkah teknis (rundown) yang akan saya jalankan untuk memperbaiki sistem sesuai analisa di atas:

### Langkah 1: Perbaikan Redirect Checkout (Frontend)
1. Buka file `frontend/src/pages/Checkout.jsx`.
2. Cari fungsi `handleCheckout`.
3. Ubah logika navigasi sukses dari `/my-orders?tab=waiting` menjadi `/my-orders?tab=unpaid`.

### Langkah 2: Perbaikan Tampilan Invoice (Frontend)
1. Buka file `frontend/src/pages/InvoiceReceipt.jsx`.
2. Perbarui state `status` saat melakukan mapping `OrderResponseDTO`.
3. Logika baru: Jika `order.paymentStatus === 'PAID'`, maka status invoice adalah `LUNAS`. Tambahkan label "Menunggu Konfirmasi" secara visual jika `order.status === 'Waiting_Verification'`.

### Langkah 3: Sinkronisasi Tab Customer Orders (Frontend)
1. Buka file `frontend/src/pages/UserOrders.jsx`.
2. Pada fungsi polling/deteksi perubahan status, pastikan `setActiveTab` berjalan mulus dan label pada kartu pesanan sesuai dengan terminologi baru (misal: "Transaksi Diterima").

### Langkah 4: Penyempurnaan Admin Dashboard (Frontend)
1. Buka file `frontend/src/pages/admin/AdminOrders.jsx`.
2. Pastikan tombol validasi pembayaran yang memindahkan dari `Waiting_Verification` ke `Processing` memberikan *feedback* "Transaksi Diterima" pada history/log.
3. Tambahkan kemampuan untuk Admin menginput **Nomor Resi (Tracking Number)** saat mengubah pesanan dari `Processing` ke `Shipped`. (Saat ini tombolnya belum ada popup input resi).

### Langkah 5: Penyempurnaan Logika Service (Backend)
1. Buka file `backend/src/main/java/com/otaku/ecommerce/service/OrderService.java`.
2. Update fungsi `updateOrderStatus` atau `updateOrderDetails` agar mewajibkan input kurir/resi saat status berubah ke `Shipped`.

---

## 3. Pertanyaan Konfirmasi (User Review)

Sebelum saya mulai melakukan *coding* untuk mengeksekusi langkah-langkah di atas, mohon konfirmasi:

1.  **Untuk poin [E]**: Apakah saat Admin mengubah status menjadi "Pengiriman" (`Shipped`), Admin akan **menginput nomor resi secara manual** dari sistem kurir, ATAU apakah sistem harus bisa melakukan *create order/pickup* ke Binderbyte secara otomatis melalui API? (Saat ini yang biasa dipakai adalah input manual resi lalu sistem yang *track* resi tersebut via Binderbyte).
2.  Apakah *Rundown* ini sudah sesuai dengan ekspektasi Anda?

Jika setuju, silakan ketik "Lanjut" atau berikan jawaban untuk pertanyaan nomor 1.

**Jawaban Nomor 1 : Admin mendapat nomor resi secara otomatis dari Binderbyte, tidak ada fitur membuat nomor resi secara. Jika masih ada fitur membuat nomor resi secara manual hapus dan gantikan mendapat nomor resi dari Binderbyte.** 

**Jawaban Nomor 2 : ya**

