# Analisa Perubahan Proyek (24 Jam Terakhir)
**Tanggal Analisa:** 25 April 2026
**Periode:** 24 April 2026 13:00 - 25 April 2026 13:00

## Ringkasan Eksekutif
Dalam 24 jam terakhir, proyek telah mengalami perkembangan signifikan, terutama pada integrasi fitur pengiriman (shipping), pelacakan pesanan (tracking), dan restrukturisasi dokumentasi besar-besaran. Fokus utama adalah pada penyelesaian alur Checkout dan manajemen pesanan.

---

## 1. Sektor Backend (Java Spring Boot)
Perubahan besar terjadi pada logika bisnis dan API pendukung.

### Fitur Baru & Perbaikan:
*   **Shipping Integration:** Implementasi `ShippingController`, `ShippingService`, dan DTO terkait (`CityResponseDTO`, `ShippingCostResponseDTO`) untuk menangani perhitungan ongkos kirim.
*   **Order Tracking:** Penambahan `TrackingController` dan `TrackingService` untuk memantau status pengiriman pesanan.
*   **User Management:** Peningkatan pada `UserController` dan penambahan `UserProfileUpdateRequestDTO` untuk mendukung pembaruan profil pengguna.
*   **Security & Config:** 
    *   Pembaruan `SecurityConfig` dan `WebConfig` untuk menangani CORS dan otorisasi akses baru.
    *   Penghapusan `CloudinaryConfig` yang kemungkinan besar dikonsolidasikan ke dalam konfigurasi layanan.
*   **Database Migration:** Penambahan file migrasi `V20260424165600__add_shipping_details_to_orders.sql` untuk mendukung penyimpanan data pengiriman di tabel order.

### File Utama yang Dimodifikasi/Ditambahkan:
- `OrderController.java`, `OrderService.java`
- `ShippingController.java` (NEW), `ShippingService.java` (NEW)
- `TrackingController.java` (NEW), `TrackingService.java` (NEW)
- `WebConfig.java`, `SecurityConfig.java`

---

## 2. Sektor Frontend (React.js)
UI/UX diperbarui untuk mendukung fitur backend yang baru diimplementasikan.

### Perubahan Utama:
*   **Checkout & Invoice:** Pembaruan pada `Checkout.jsx` dan `InvoiceReceipt.jsx` untuk mengintegrasikan pilihan kurir dan perhitungan ongkir.
*   **User & Admin Dashboard:** 
    *   `UserOrders.jsx` dan `AdminOrders.jsx` diperbarui untuk menampilkan status pelacakan.
    *   `Profile.jsx` kini mendukung fitur pembaruan profil yang lebih lengkap.
*   **Context & State:** `CartContext.jsx` diperbarui untuk sinkronisasi data keranjang yang lebih baik.
*   **General UI:** Penyesuaian pada `Home.jsx`, `Login.jsx`, `Register.jsx`, dan halaman produk (`Manga.jsx`, `Merchandise.jsx`).

---

## 3. Sektor Dokumentasi & Struktur
Terjadi restrukturisasi folder dokumentasi untuk meningkatkan keterbacaan dan manajemen versi berdasarkan tanggal.

### Restrukturisasi:
- Pemindahan file dari folder kode lama (`Zzz`, `Xxx`, `Yyy`, `Vvv`, `Www`) ke folder berbasis tanggal (`190426`, `200426`, `210426`, `220426`, `230426`, `240426`).
- Penambahan dokumentasi baru:
    - `240426/BugFixes.md`
    - `240426/Dokumentasi_Perbaikan_Integrasi.md`
    - `240426/Rencana_Perbaikan_Integrasi.md`

---

## 4. Aset Statis
Penambahan aset gambar untuk produk baru (figures dan outfits) di direktori `backend/uploads/`.

---

## Kesimpulan
Proyek telah mencapai fase integrasi fungsionalitas eksternal (Shipping) yang krusial untuk operasional e-commerce. Stabilitas sistem ditingkatkan melalui perbaikan konfigurasi keamanan dan restrukturisasi dokumentasi yang memudahkan pelacakan pengembangan ke depan.

**Status:** ✅ Berjalan sesuai roadmap pengembangan.
