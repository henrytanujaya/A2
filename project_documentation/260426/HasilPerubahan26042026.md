# Dokumentasi Perubahan & Integrasi - 26 April 2026

Dokumen ini merangkum seluruh perubahan teknis dan progres integrasi yang dilakukan hari ini, terutama terkait perbaikan akses Admin Dashboard dan kelanjutan Integrasi Ke-5.

## 1. Perbaikan Bug: 403 Forbidden (Admin Panel)

Ditemukan masalah di mana Admin tidak dapat mengambil data pesanan (`GET /api/v1/orders/all`). Setelah analisis mendalam menggunakan *tracing log*, ditemukan dua penyebab utama:
1.  **Routing Conflict**: Endpoint `/all` bertabrakan dengan pola path variable `{id}`.
2.  **Stale Session**: Spring Security memuat identitas anonim atau data session lama yang menghalangi filter JWT untuk menyetel identitas Admin yang baru.

### Perubahan Backend:
*   **`OrderController.java`**: 
    *   Reposisi method `getAllOrders` ke atas `getOrderById`.
    *   Menambahkan parameter `Authentication` untuk verifikasi internal.
*   **`SecurityConfig.java`**:
    *   Mengubah `SessionCreationPolicy` dari `IF_REQUIRED` menjadi **`STATELESS`**. Ini memastikan sistem murni menggunakan JWT tanpa bergantung pada Cookie/Session server.
    *   Menambahkan `.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()` untuk mengizinkan request *preflight* CORS dari browser.
    *   Menambahkan aturan eksplisit untuk `/api/v1/orders/all` bagi role `Admin`.
*   **`JwtAuthenticationFilter.java`**:
    *   Memperbarui logika pengecekan agar tetap menyetel autentikasi dari JWT meskipun sistem mendeteksi adanya `AnonymousAuthenticationToken`.
    *   Menghapus penyimpanan autentikasi ke dalam session (`setAttribute`) untuk mematuhi prinsip *Stateless*.

### Perubahan Frontend:
*   **`axiosInstance.js`**:
    *   Menambahkan log diagnostik `[AXIOS-DEBUG]` untuk memantau apakah token berhasil dilampirkan pada setiap request.

## 2. Progres Integrasi Ke-5 (Validasi Pembayaran)

Melanjutkan alur: **Pilih Produk > Pengiriman > Pembayaran > Validasi Admin > Invoice Final.**

*   **Status Baru**: Implementasi status `Waiting_Verification` telah selesai di backend (`OrderService.java`).
*   **Simulasi Pembayaran**: Halaman `InvoiceReceipt.jsx` kini otomatis mengubah status pesanan menjadi `Waiting_Verification` setelah user melakukan simulasi pembayaran (Upload Bukti).
*   **Fitur Admin**: Halaman `AdminOrders.jsx` telah dilengkapi dengan tab "Waiting Verification" dan tombol "Validate Payment" untuk menyetujui pesanan.

## 3. Hasil Verifikasi Akhir

| Fitur | Status | Catatan |
| :--- | :--- | :--- |
| Login Admin | **BERHASIL** | Role `Admin` dikenali dengan benar. |
| Fetch All Orders | **BERHASIL** | Tidak ada lagi error 403 setelah migrasi ke Stateless. |
| Transisi Status | **BERHASIL** | `Pending` -> `Waiting_Verification` via Frontend. |
| Log Tracing | **AKTIF** | Memudahkan debugging jika terjadi kendala token di masa depan. |

---
**Penyusun**: Antigravity AI
**Status Proyek**: Stabil - Integrasi Ke-5 Siap Dilanjutkan.
