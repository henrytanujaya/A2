# 📋 Fase 5: Perencanaan Integrasi Akhir Frontend & Backend (Final Integration)

Melanjutkan catatan dari dokumentasi Fase 2, 3, dan 4, fase ini bertujuan untuk menyelesaikan seluruh *gap* integrasi antara tampilan Frontend dengan fungsionalitas Backend yang telah dibuat.

## 📌 Ringkasan Eksekusi yang Dibutuhkan

Pekerjaan ini mencakup perubahan di banyak halaman utama Frontend (`CartContext`, `Checkout`, `Profile`, `Home`, `Manga`, `Merchandise`) dan penambahan endpoint di Backend (`UserController` untuk Profile).

---

## 1️⃣ Backend Components (Yang Harus Ditambahkan/Diubah)

Pembaruan pada backend untuk melengkapi endpoint yang dibutuhkan frontend.

### [NEW] `UserController.java`
Membuat REST controller baru dengan endpoint:
- `GET /api/v1/users/profile`: Mengambil data profil user saat ini (via SecurityContext).
- `PUT /api/v1/users/profile`: Update nama, nomor telepon (phone), dan alamat (address).

### [MODIFY] `UserService.java`
- Tambahkan logika bisnis `updateProfile(userId, requestDTO)` yang memperbarui data user ke database.
- Tambahkan DTO `UserProfileUpdateRequestDTO` untuk request body dari API.

---

## 2️⃣ Frontend API Context & Integration

Mengintegrasikan State Management dan halaman statis Frontend ke Backend agar data tidak lagi *hardcoded* atau menggunakan *local storage* murni.

### [MODIFY] `CartContext.jsx`
- **Tujuan**: Mengubah implementasi penyimpanan keranjang dari *local storage* menjadi panggilan API.
- **Implementasi**:
  - Gunakan `GET /api/v1/cart` (jika user login) atau `GET /api/v1/cart/guest` (menggunakan header `X-Guest-ID` jika guest).
  - Ubah fungsi `addToCart`, `removeFromCart`, dan `clearCart` agar menembak API terkait di backend sebelum melakukan update state di UI.

### [MODIFY] `Login.jsx`
- **Tujuan**: Sinkronisasi keranjang Guest ke User.
- **Implementasi**: Panggil API `POST /api/v1/cart/sync` setelah proses login berhasil. Hal ini akan memindahkan item-item di keranjang Guest (dari Redis) masuk ke keranjang permanen User (di SQL Server).

### [MODIFY] `Checkout.jsx`
- **Tujuan**: Menghubungkan proses checkout dengan sistem pesanan & pembayaran backend.
- **Implementasi**:
  - Ubah simulasi pembuatan invoice menjadi pembuatan order ke backend.
  - Panggil `POST /api/v1/orders` untuk membuat pesanan (Create Order) berdasarkan item di keranjang.
  - Setelah mendapatkan `orderId`, otomatis panggil `POST /api/v1/payments/token` untuk memicu mock payment gateway.
  - Redirect user ke `paymentUrl` (atau halaman *Invoice* simulasi pembayaran yang mengambil URL token).

### [MODIFY] `Profile.jsx`
- **Profil Update**: Ubah fitur penyimpanan profil agar memanggil `PUT /api/v1/users/profile`.
- **Order History**: Ambil pesanan milik user melalui API `GET /api/v1/orders/my-orders`.
- **Tracking Timeline**: Tambahkan desain antarmuka Timeline Status berdasarkan `trackingHistory` yang dikembalikan dari DTO (untuk menampilkan riwayat pelacakan pesanan seperti *Pending*, *Paid*, *Shipped*, dll).

### [MODIFY] `Manga.jsx`, `Home.jsx`, & `Merchandise.jsx`
- **Tujuan**: Memastikan data produk adalah data *live* dari database.
- **Implementasi**:
  - Hapus data array produk *hardcoded*.
  - Ambil data secara asinkron menggunakan fungsi GET `axiosInstance` ke endpoint `/api/v1/products` (dan query category `/api/v1/products?category=Manga`).
  - Tampilkan indikator Loading (skeleton/spinner) saat proses *fetch*.

---

## 🔍 Verification Plan (Metode Pengujian Nanti)

1. **Cart & Sync Test**: Saya akan login dari status Guest yang sudah menambahkan barang di keranjang, kemudian memeriksa apakah barang tersebut berhasil disinkronisasi ke akun User.
2. **Checkout Flow**: Saya akan mencoba membuat pesanan hingga muncul Webhook Payment Gateway dan memastikan status order terupdate menjadi *Paid* serta tercatat di tabel *OrderTracking*.
3. **Profile Test**: Saya akan mengganti No Telp dan Alamat di UI Profile dan memastikan data tersebut permanen tersimpan di database.
4. **Data Live Test**: Halaman *Home* dan *Manga* akan dirender dan diverifikasi untuk memunculkan gambar dan produk dari backend, bukan *placeholder*.
