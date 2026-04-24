# Rundown & Implementation Plan: Otaku E-Commerce

Rencana kerja ini disusun berdasarkan prioritas pada `todolist.md` untuk memastikan pengembangan berjalan sistematis dan terintegrasi.

## 📅 Jadwal Kerja (Rundown)

### Fase 1: Pemantapan Integrasi & Keamanan (Poin 1 & 6)
**Tujuan**: Memastikan pondasi komunikasi FE-BE aman dan stabil.
- [x] Verifikasi endpoint autentikasi Hybrid (JWT + Session Redis).
- [x] Pengetesan CORS untuk semua origin (localhost:5173).
- [x] Audit Role-Based Access Control (RBAC) pada `SecurityConfig.java`.
- [x] Penyesuaian `ApiResponse` agar seragam di semua controller.

### Fase 2: Database Alignment (Poin 2)
**Tujuan**: Menyelaraskan struktur data backend dengan tampilan UI frontend.
- [x] Review schema database (SQL Server) vs Model Frontend.
- [x] Identifikasi kolom/tabel yang kurang (misal: Gambar produk tambahan, deskripsi panjang).
- [x] Pembuatan script Flyway Migration (`V2026...__add_missing_fields.sql`).

### Fase 3: Modul Keranjang & Sinkronisasi (Poin 3)
**Tujuan**: Implementasi sistem cart yang persisten dan responsif.
- [x] Implementasi `CartController` dan `CartService`.
- [x] Penyimpanan item keranjang di Redis (untuk guest) dan DB (untuk user login).
- [x] API untuk merge keranjang guest ke user saat login.

### Fase 4: Sistem Pembayaran & Order Tracking (Poin 4 & 5)
**Tujuan**: Menyelesaikan alur transaksi utama.
- [x] Implementasi `PaymentService` (Integrasi Midtrans/Xendit mock).
- [x] Penambahan tabel `OrderTracking` untuk riwayat status pengiriman.
- [x] Update `OrderService` untuk mendukung notifikasi perubahan status.

---

## 🛠️ Detail Teknis Eksekusi

### 1. Integrasi & Akses Kontrol
- **Backend**: Pastikan `@PreAuthorize` terpasang di level service/controller.
- **Frontend**: Gunakan Axios interceptor untuk menangani 401 dan redirect ke login.

### 2. Database Sync
- Gunakan `Vvv/DatabaseVersiBaru.md` sebagai referensi perubahan skema.
- Pastikan dummy data diperbarui setelah perubahan skema.

### 3. Payment Flow
- Alur: `Create Order` -> `Get Payment Token` -> `Frontend Checkout` -> `Webhook Notification` -> `Update Order Status`.

---
*Target: Sistem MVP Terintegrasi Penuh*
*PIC: Antigravity AI*
