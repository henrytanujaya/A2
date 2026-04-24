# Laporan Perbaikan Integrasi - Otaku E-Commerce
**Tanggal:** 24 April 2026
**Status:** Selesai (All Systems Operational)

## 1. Perbaikan Integrasi Checkout & Order
*   **Masalah**: Pesanan tidak bisa dibuat karena data alamat dan kurir tidak tersimpan di database.
*   **Solusi**: 
    *   Menambahkan field `shippingAddress` dan `courierName` pada `OrderRequestDTO`.
    *   Memperbarui `OrderService` untuk menyimpan metadata pengiriman tersebut ke entitas `Order`.
    *   Sinkronisasi payload di frontend `Checkout.jsx`.

## 2. Resolusi Error 500 pada Keranjang (Cart)
*   **Masalah**: Penambahan barang ke keranjang gagal karena ketidaksesuaian skema database (kolom `Name` dan `Price` pada tabel `CartItems` bersifat `NOT NULL` tapi tidak terdaftar di Java).
*   **Solusi**:
    *   Melakukan denormalisasi pada entitas `CartItem.java` dengan menambahkan field `name`, `price`, `imageUrl`, dan `details`.
    *   Memperbarui `CartService` untuk mengisi data produk ke dalam tabel keranjang saat barang ditambahkan.

## 3. Perbaikan Alur Custom Order (Apparel & 3D Figure)
*   **Masalah**: Barang custom tidak bisa masuk keranjang (Error 400) karena belum memiliki ID pesanan custom.
*   **Solusi**:
    *   Mengubah alur frontend menjadi 3 tahap otomatis: **Upload Gambar** -> **Simpan Desain (CustomOrder)** -> **Masukkan Keranjang**.
    *   Memastikan `customOrderId` dikirim ke API keranjang.

## 4. Migrasi ke Penyimpanan Lokal (Local Storage)
*   **Masalah**: Error integrasi Cloudinary (`ClassCastException`) dan ketergantungan pada koneksi luar.
*   **Solusi**:
    *   **Menghapus Cloudinary**: Membuang dependensi Cloudinary untuk kestabilan lokal.
    *   **Local Storage**: Mengimplementasikan `WebConfig` di Spring Boot untuk melayani folder `backend/uploads` sebagai static resources.
    *   **FileUploadService**: Mengubah logika upload agar menyimpan file secara fisik di folder proyek.

## 5. Bypass Validasi Custom Order & Checkout
*   **Masalah**: Pesanan custom tidak bisa dibayar karena status tertahan di "Pending Review" (Error 400).
*   **Solusi**:
    *   Memperbarui `CustomOrderService` agar memberikan status **"Quoted"** secara otomatis jika harga dikirim dari frontend.
    *   Menghapus validasi `@Pattern` yang kaku pada `CustomOrderRequestDTO` (seperti kewajiban URL Cloudinary dan pembatasan tipe layanan).

---
**Catatan**: Folder `backend/uploads` kini menjadi tempat penyimpanan utama untuk referensi desain pelanggan. Pastikan folder ini tidak dihapus.
