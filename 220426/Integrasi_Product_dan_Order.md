# Laporan Analisis Integrasi Frontend dan Backend
**Sektor:** Produk, Order, Custom Order, Diskon

Berdasarkan pengecekan ulang pada source code frontend dan backend, ditemukan **perbedaan yang sangat signifikan**. Saat ini, sistem **BELUM** terintegrasi secara lengkap pada sektor Produk, Order, Custom Order, maupun Diskon. Frontend masih berjalan menggunakan *mock data* (data statis) dan *local state* tanpa melakukan request ke API Backend (Controller) yang sudah tersedia.

Berikut rincian hasil analisa per sektor:

## 1. Sektor Produk (Product)
- **Status Integrasi:** Belum Terintegrasi ❌
- **Kondisi Frontend:** Pada halaman `Manga.jsx` dan `Merchandise.jsx`, daftar produk masih dirender menggunakan hardcoded array / mock data (`mangaDatabases` dan `merchPackages`).
- **Kondisi Backend:** Sudah terdapat `ProductController.java` dengan fungsionalitas list/get produk.
- **Kekurangan:** Frontend belum menggunakan Axios untuk memanggil endpoint produk dari backend.

## 2. Sektor Order (Pesanan)
- **Status Integrasi:** Belum Terintegrasi ❌
- **Kondisi Frontend:** Halaman `Cart.jsx` menggunakan state lokal (`CartContext.jsx`) yang menyimpannya ke `localStorage`. Tombol "Checkout Sekarang" masih berupa tampilan statis dan belum memiliki fungsi yang mengarah ke server.
- **Kondisi Backend:** Sudah terdapat `OrderController.java` dan `AdminOrderController.java` untuk manajemen pesanan.
- **Kekurangan:** Perlu dibuatkan fungsi checkout yang mengirim data (payload) pesanan ke API backend.

## 3. Sektor Custom Order (Pesanan Kustom)
- **Status Integrasi:** Belum Terintegrasi ❌
- **Kondisi Frontend:** Pada halaman `CustomApparel.jsx` dan `Custom3D.jsx`, perhitungan harga serta kustomisasi diatur secara statis pada client-side. Ketika tombol "Masukkan Keranjang" ditekan, data hanya disimpan di context lokal keranjang.
- **Kondisi Backend:** Terdapat `CustomOrderController.java` untuk menghandle penerimaan spesifikasi pesanan kustom dan desain terkait.
- **Kekurangan:** Upload desain dan data spesifikasi (baju/3D) belum dikirim ke endpoint backend terkait.

## 4. Sektor Diskon (Discount)
- **Status Integrasi:** Belum Terintegrasi ❌
- **Kondisi Frontend:** Belum ada form atau input untuk menerapkan kode promo / diskon di halaman `Cart.jsx`.
- **Kondisi Backend:** Terdapat `DiscountController.java` di backend yang berfungsi untuk validasi dan penerapan diskon pesanan.
- **Kekurangan:** Diperlukan UI tambahan di halaman keranjang/checkout untuk input kupon diskon dan pemanggilan request ke API Diskon backend.

---
**Kesimpulan:**
Integrasi antara React Frontend dan Spring Boot Backend untuk saat ini baru sebatas fitur Otentikasi (Login & Register). Untuk sektor Produk, Pesanan umum, Custom Order, dan Diskon wajib dilakukan pembuatan API services baru di frontend (menggunakan `axiosInstance`) agar fitur-fitur tersebut dapat beroperasi menggunakan data asli dari database.
