# Dokumentasi Pengembangan Otaku E-Commerce
**Tanggal**: 27 April 2026
**Lokasi Proyek**: `c:\Antigravity\A2`

## 1. Ringkasan Perubahan (Executive Summary)
Hari ini fokus utama adalah pada **Manajemen Stok Otomatis**, **Stabilitas Sistem (Fix Infinite Loop)**, dan **Peningkatan UX Customer** melalui fitur Pemilih Jumlah (Quantity Selector) serta integrasi pelacakan real-time.

---

## 2. Timeline Pengerjaan
| Waktu | Kategori | Deskripsi Fitur / Perubahan | Status |
| :--- | :--- | :--- | :--- |
| 09:30 | **Backend** | Implementasi Atomic Stock Decrement di `ProductRepository` & `OrderService`. | ✅ Selesai |
| 10:15 | **Integrasi** | Update Xendit Webhook untuk menangani status `STOCK_CONFLICT` jika stok habis saat bayar. | ✅ Selesai |
| 11:00 | **UI/UX** | Pembatasan Kurir hanya **JNE** & **SiCepat** pada halaman Checkout. | ✅ Selesai |
| 11:45 | **Fix Bug** | Memperbaiki *Infinite Loop* pada polling `UserOrders.jsx` yang menyebabkan spam request ke backend. | ✅ Selesai |
| 12:30 | **UI/UX** | Implementasi Auto-Polling & Pop-up Konfirmasi Admin secara real-time di sisi customer. | ✅ Selesai |
| 13:15 | **Fitur Baru** | Penambahan Fitur **Quantity Selector** (+/-) pada Manga & Merchandise. | ✅ Selesai |
| 13:45 | **Fitur Baru** | Penambahan Fitur **Quantity Selector** pada Custom Apparel & Custom 3D Figure. | ✅ Selesai |
| 14:00 | **Integrasi** | Integrasi Real-time Tracking (Binderbyte) pada halaman Invoice & Pesanan Saya. | ✅ Selesai |

---

## 3. Detail Teknis Perubahan

### A. Manajemen Stok (Atomic Operations)
- **File**: `ProductRepository.java`, `OrderService.java`, `PaymentService.java`
- **Logika**: Stok dikurangi hanya saat pembayaran diverifikasi (`PAID`). Jika stok tidak mencukupi, pesanan dialihkan ke status `STOCK_CONFLICT`.

### B. Stabilitas Frontend
- **File**: `UserOrders.jsx`
- **Perubahan**: Mengubah mekanisme `useEffect` agar tidak bergantung pada state yang sering berubah secara internal. Menggunakan *functional update* pada `setPrevStatuses`.

### C. Fitur Pemilih Jumlah (Quantity Selector)
- **File**: `Manga.jsx`, `Merchandise.jsx`, `CustomApparel.jsx`, `Custom3D.jsx`
- **Logic**: 
  - Validasi minimal 1 item.
  - Validasi maksimal berdasarkan `stockQuantity` dari database.
  - Integrasi dengan `CartContext` untuk pengiriman data ke server.

### D. Logistik & Pembayaran
- **Checkout**: Hanya menampilkan opsi JNE dan SiCepat sesuai permintaan user.
- **Redirect**: Setelah bayar di Xendit, user otomatis diarahkan ke halaman **Pesanan Saya**, bukan lagi ke Home.

---

## 4. Daftar File yang Diperbarui
1. `backend/src/main/java/com/otaku/ecommerce/repository/ProductRepository.java`
2. `backend/src/main/java/com/otaku/ecommerce/service/OrderService.java`
3. `backend/src/main/java/com/otaku/ecommerce/service/PaymentService.java`
4. `frontend/src/pages/UserOrders.jsx`
5. `frontend/src/pages/Checkout.jsx`
6. `frontend/src/pages/Manga.jsx`
7. `frontend/src/pages/Merchandise.jsx`
8. `frontend/src/pages/CustomApparel.jsx`
9. `frontend/src/pages/Custom3D.jsx`
10. `frontend/src/pages/InvoiceReceipt.jsx`

---
*Dokumentasi ini dibuat secara otomatis oleh Antigravity AI Coding Assistant.*
