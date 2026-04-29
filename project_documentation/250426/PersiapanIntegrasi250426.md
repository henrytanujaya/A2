# Persiapan Integrasi Sistem (25 April 2026)
**Berdasarkan Dokumen:** [Analisa_Perubahan_24Jam.md](file:///c:/Antigravity/A2/250426/Analisa_Perubahan_24Jam.md)

## 0. Prasyarat & Persiapan Sebelum Eksekusi
Sebelum menjalankan rundown di bawah, pastikan poin-poin berikut sudah siap:

1.  **Kredensial API:**
    *   Siapkan API Key RajaOngkir (Pro/Starter) yang valid.
    *   Pastikan API Key sudah dimasukkan ke dalam `.env` atau `application.yml`.
2.  **Akses Database:**
    *   Akses ke database untuk menjalankan/verifikasi migrasi Flyway.
    *   Pastikan database dalam keadaan bersih (Clean Data) untuk menghindari konflik ID.
3.  **Lingkungan Pengujian (Tools):**
    *   **Postman/Insomnia:** Untuk pengujian endpoint `/api/shipping` dan `/api/tracking` secara terpisah.
    *   **Browser DevTools:** Untuk memantau network request di frontend.
4.  **Data Uji (Test Data):**
    *   Daftar ID Kota/Provinsi asal dan tujuan untuk simulasi ongkir.
    *   Akun User testing dengan alamat lengkap yang valid.
    *   Akun Admin untuk simulasi input nomor resi.
5.  **Koneksi Internet:** Karena sistem bergantung pada API eksternal, pastikan koneksi stabil dan tidak terblokir firewall.

---

## 1. Tahapan Integrasi Antar Sektor
Untuk memastikan seluruh perubahan dalam 24 jam terakhir berjalan sinkron, berikut adalah tahapan integrasinya:

### A. Sinkronisasi Data (Database & Backend)
1.  **Verifikasi Skema:** Pastikan kolom baru pada migrasi `V20260424165600` telah terisi otomatis saat `OrderService` membuat pesanan baru.
2.  **Validasi DTO:** Sinkronisasi antara `ShippingCostResponseDTO` dengan format data yang dikembalikan oleh API RajaOngkir untuk menghindari mismatch tipe data.

### B. Konektivitas API (Backend & Frontend)
1.  **Endpoint Binding:** Menghubungkan `Checkout.jsx` dengan `ShippingController` untuk mendapatkan daftar kota dan biaya ongkir secara real-time.
2.  **Tracking Bridge:** Mengintegrasikan `UserOrders.jsx` dengan `TrackingController` sehingga nomor resi yang diinput admin dapat langsung dipantau oleh user.

### C. Finalisasi Alur Pembayaran
1.  **Total Perhitungan:** Menggabungkan `Subtotal` + `Shipping Cost` + `Tax (jika ada)` di sisi backend sebelum diteruskan ke gateway pembayaran.
2.  **State Management:** Memastikan `CartContext` dibersihkan hanya setelah status pembayaran dikonfirmasi sukses.

---

## 2. Hal-hal yang Perlu Ditambah dan Dihapus

### ✅ Perlu Ditambah (Additions)
*   **Error Handling Global:** Menambahkan interceptor untuk menangani kegagalan API eksternal (RajaOngkir/Tracking) agar tidak menyebabkan crash pada UI.
*   **Loading Indicators:** Animasi loading pada tombol "Cek Ongkir" di halaman Checkout.
*   **Validation:** Regex untuk validasi nomor resi di sisi admin.
*   **Unit Tests:** Pengujian khusus untuk `ShippingService` untuk memastikan perhitungan berat produk akurat.

### ❌ Perlu Dihapus (Deletions)
*   **Obsolete Docs Folder:** Menghapus folder `Zzz`, `Xxx`, `Yyy`, `Vvv`, `Www` yang sudah kosong setelah restrukturisasi.
*   **Hardcoded API Keys:** Memindahkan semua API Key dari `application.yml` ke environment variables demi keamanan.
*   **Dummy Data:** Membersihkan data testing lama di database yang tidak sesuai dengan skema shipping baru.
*   **Unused Imports:** Pembersihan class-class yang tidak lagi digunakan di `WebConfig` dan `SecurityConfig`.

---

## 3. Rundown Implementasi Terperinci (25 April 2026)

| Waktu | Aktivitas | Penanggung Jawab | Target |
| :--- | :--- | :--- | :--- |
| **09:00 - 10:00** | **API Sync & Testing** | Backend Team | Semua endpoint shipping & tracking return 200 OK. |
| **10:00 - 11:30** | **E2E Checkout Flow** | Fullstack | Alur dari pilih produk -> pilih ongkir -> bayar lancar. |
| **11:30 - 12:30** | **Database Audit** | Backend Team | Data shipping tersimpan dengan benar di tabel `orders`. |
| **12:30 - 13:30** | *Istirahat* | - | - |
| **13:30 - 15:00** | **UI/UX Polish** | Frontend Team | Responsivitas halaman Invoice dan Profile di mobile. |
| **15:00 - 16:00** | **Security Hardening** | DevSecOps | Pemindahan API Keys ke Env Var & Filter CORS. |
| **16:00 - 17:00** | **Final Documentation** | Lead Dev | Update Master Documentation & Archive file lama. |

---

## Kesimpulan Akhir
Integrasi hari ini akan memfokuskan pada **Reliability** (Keandalan). Dengan adanya fitur shipping eksternal, sistem menjadi lebih kompleks sehingga penanganan error menjadi prioritas utama sebelum rilis ke tahap berikutnya.

**Status Persiapan:** ⚠️ *Ready for Execution* (Menunggu verifikasi API Key).
