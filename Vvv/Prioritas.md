# Analisis Mendalam & Prioritas Integrasi Database, Backend, dan Frontend

## 1. Breakdown Kesesuaian Data (DB/Backend vs Frontend)

Setelah melakukan analisa mendalam terhadap *Source Code* Backend (Entity dan DTO) serta *Source Code* Frontend (React State dan Mock Data), ditemukan ketidaksesuaian yang signifikan antara struktur data database dengan struktur yang di-ekspektasikan oleh Frontend.

### A. Sektor Product
- **Database/Backend (Entity: `Product`):** Menggunakan field `id`, `category`, `name`, `description`, `price`, `stockQuantity`, `imageUrl`.
- **Frontend (Mock Data `Manga.jsx` / `Merchandise.jsx`):** Menggunakan field `id`, `genre`, `title`, `price`, `image`, `rating`, `dateAdded`.
- **Ketidaksesuaian:**
  - Penamaan properti berbeda (`name` vs `title`, `category` vs `genre`, `imageUrl` vs `image`).
  - Frontend menggunakan `rating` dan `dateAdded` untuk fitur *sorting*, tetapi tabel database backend sama sekali tidak memiliki kolom tersebut.
  - Frontend mengabaikan `description` dan `stockQuantity` (sangat berisiko terjadi *overselling* saat checkout karena stok tidak divalidasi client).

### B. Sektor Order (Checkout & Cart)
- **Database/Backend (`OrderRequestDTO`):** Membutuhkan payload berupa list `items` (wajib berisi `productId` atau `customOrderId`, dan `quantity`), serta opsional `discountCode`.
- **Frontend (`Cart.jsx` & `CartContext.jsx`):** State keranjang hanya menyimpan `cartId` (UUID client), `name`, `price`, `image`, dan `details` teks biasa.
- **Ketidaksesuaian:**
  - **Sangat Krusial:** Frontend saat ini *tidak menyimpan* `productId` dari item yang ditambahkan ke keranjang. Tanpa `productId`, API Checkout backend tidak akan pernah tahu produk fisik apa yang sedang dibeli.
  - Backend Entity `Order` belum memiliki field untuk `shippingAddress` (Alamat Pengiriman), padahal ini adalah kewajiban untuk sistem e-commerce.

### C. Sektor Custom Order
- **Database/Backend (Entity: `CustomOrder`):** Alur kerja sistem adalah: User submit request (`serviceType`, `imageReferenceUrl`, `configurationJson`) -> Status menjadi `Pending Review` -> Admin melakukan validasi desain dan menetapkan harga (`price`) -> Status berubah -> Baru bisa dibayar.
- **Frontend (`CustomApparel.jsx` / `Custom3D.jsx`):** Saat ini langsung mengkalkulasi harga secara statis di sisi klien dan seketika langsung memasukkannya ke `CartContext` ketika di-klik.
- **Ketidaksesuaian:**
  - Alur bisnis Frontend melakukan *bypass* validasi admin.
  - Frontend belum terintegrasi dengan upload Cloudinary untuk menghasilkan link `imageReferenceUrl` sebelum submit.

### D. Sektor Discount
- **Database/Backend (Entity: `Discount`):** Sudah memiliki validasi kode kupon, batas penggunaan, dan diskon persen/fix.
- **Frontend (`Cart.jsx`):** Tidak memiliki UI/Input Text sama sekali untuk memasukkan dan memvalidasi "Kode Promo" sebelum proses checkout.

---

## 2. Kekurangan dan Hal yang Perlu Ditambahkan Secara Mendetail

1. **Penyesuaian Skema Database (Backend):**
   - Tambahkan properti `rating` (opsional) dan `createdAt` pada `Product.java` agar fitur sorting Frontend berfungsi dengan data real.
   - Tambahkan kolom `shippingAddress` dan `paymentMethod` pada `Order.java` dan `OrderRequestDTO.java`.

2. **Refactor UI dan Model Payload Frontend:**
   - Ubah map/render object di frontend dari `.title` menjadi `.name`, `.image` menjadi `.imageUrl`, dan seterusnya.
   - Di halaman detail produk, tambahkan pengecekan `stockQuantity`. Jika 0, *disable* tombol Add to Cart.

3. **Perbaikan Context Keranjang (`CartContext.jsx`):**
   - Modifikasi `addToCart()` agar wajib menerima atribut `productId` (atau `customOrderId`) dan `quantity`. State keranjang harus mencerminkan struktur `OrderItemRequestDTO`.

4. **Re-Arsitektur Custom Order (Sangat Penting):**
   - Hapus fungsi langsung "Add to Cart" di halaman Custom Order.
   - Ganti tombol tersebut dengan "Kirim Permintaan / Request Quote". Payload dikirim ke endpoint POST `/api/custom-orders`.
   - Buat halaman User Dashboard khusus (**My Custom Orders**) agar user bisa melihat status pengajuannya. Tampilkan tombol "Checkout/Add to Cart" di dashboard tersebut **hanya jika** statusnya sudah "Quoted/Priced".

5. **Pengembangan Halaman Cart & Checkout:**
   - Tambahkan input field untuk diskon di `Cart.jsx`.
   - Tambahkan modal atau tahapan *Shipping Info* sebelum mengklik "Place Order".
   - Buat fungsi Axios untuk menembak endpoint POST `/api/orders`.

---

## 3. Rundown Tahapan Pengerjaan

Berikut adalah langkah-langkah sistematis yang harus dikerjakan:

**FASE 1: Sinkronisasi Database dan Backend (Prioritas Tinggi)**
- [ ] Update `Product.java` dengan field `rating` dan `createdAt`.
- [ ] Update `Order.java` dan DTO dengan field alamat pengiriman.
- [ ] Restart backend Spring Boot untuk melakukan *Auto-DDL* tabel.
- [ ] Insert data dummy baru yang lebih lengkap via SQL untuk testing API.

**FASE 2: Integrasi Katalog Produk Frontend**
- [ ] Hapus data statis/mock pada `Manga.jsx` dan `Merchandise.jsx`.
- [ ] Buat Axios Service `getProductList`.
- [ ] Implementasikan `useEffect` untuk _fetch_ data dan sinkronisasikan properti UI (`name`, `imageUrl`, dll).

**FASE 3: Pembangunan Logic Keranjang dan Diskon**
- [ ] Rombak `CartContext.jsx` untuk menyimpan data `productId`.
- [ ] Buat UI Input Kode Diskon di halaman `Cart.jsx` dan hubungkan ke API POST/GET validasi diskon backend.
- [ ] Kalkulasi Total Harga ulang berdasarkan respons dari API diskon.

**FASE 4: Re-Arsitektur Custom Order (Kompleks)**
- [ ] Buat fungsi Upload File gambar desain ke Cloudinary dari Frontend.
- [ ] Ubah behavior halaman Custom Order untuk mengirim data ke POST `/api/custom-orders` beserta link Cloudinary dan JSON Konfigurasi.
- [ ] Buat halaman "Riwayat Custom Order" untuk user memonitor status harga yang di-*review* Admin.

**FASE 5: Penyelesaian Checkout System**
- [ ] Tambahkan form Alamat Pengiriman di alur keranjang.
- [ ] Hubungkan tombol "Checkout Sekarang" ke POST `/api/orders` dengan body request yang sesuai `OrderRequestDTO`.
- [ ] Jika API mengembalikan sukses, *clear* context keranjang lokal dan arahkan user ke halaman Sukses.
