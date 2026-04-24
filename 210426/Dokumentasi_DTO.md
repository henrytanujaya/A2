# Dokumentasi Lengkap DTO (Data Transfer Object) Otaku E-Commerce

Dokumen ini menjelaskan fungsi, alur logika, struktur properti, dan penggunaan dari setiap file DTO yang berada di dalam direktori `backend/src/main/java/com/otaku/ecommerce/dto`.

Secara umum, DTO (Data Transfer Object) adalah *design pattern* yang digunakan untuk mentransfer data antara client (frontend/mobile) dan server (backend) tanpa mengekspos entitas database (JPA/Hibernate) secara langsung. 

**Tujuan Utama Penggunaan DTO:**
1. **Keamanan (Security):** Menyembunyikan field sensitif (seperti `password`, `createdAt`, `updatedAt`, `role`) dari jangkauan client.
2. **Integritas Bisnis (Anti-Tampering):** Mencegah manipulasi data, seperti modifikasi harga secara ilegal pada *payload* JSON atau memodifikasi ID pengguna lain (kerentanan IDOR - *Insecure Direct Object Reference*).
3. **Performa & Stabilitas (Avoid LazyInitializationException):** Menghindari masalah rekursif tanpa batas (*infinite recursion*) atau *Lazy Initialization* yang sering terjadi ketika Spring merepresentasikan objek entitas Hibernate dengan relasi tabel langsung ke format JSON.
4. **Decoupling (Pemisahan Kontrak):** Memastikan perubahan struktur tabel di database tidak secara otomatis merusak API yang sedang dipakai oleh aplikasi Frontend.

---

## 1. Standardisasi Response

### `ApiResponse.java`
*   **Fungsi:** Menjadi standar pembungkus (wrapper) universal untuk seluruh response (balasan) dari API ke client. Memastikan Frontend selalu menerima struktur JSON yang terprediksi dan seragam untuk mempermudah *error handling*.
*   **Properti / Field Utama:**
    *   `success` (boolean): `true` jika operasi API berhasil, `false` jika terjadi error/ditolak.
    *   `internalCode` (String): Kode status kustom untuk panduan logika frontend (contoh: `"SUCCESS_200"`, `"ERR_AUTH_001"`, `"ERR_VALIDATION"`).
    *   `message` (String): Pesan *human-readable* mengenai hasil eksekusi (contoh: `"Login berhasil"`, `"Produk tidak ditemukan"`).
    *   `data` (Generic `<T>`): Payload/data inti yang diminta (bisa berupa Objek Tunggal, Array/List, atau `null` jika error).
    *   `timestamp` (LocalDateTime): Waktu presisi saat response di-generate oleh server.
*   **Alur & Penggunaan:**
    *   Setiap method Controller yang berhasil akan membungkus return value-nya dengan: `ApiResponse.success("SUCCESS", "Berhasil", payload)`.
    *   Jika tertangkap error (misalnya oleh `GlobalExceptionHandler`), backend me-return: `ApiResponse.error("ERR_500", "Terjadi kesalahan internal")`.

---

## 2. Authentication (Autentikasi & Otorisasi)

### `LoginRequestDTO.java`
*   **Fungsi:** DTO yang berfungsi menampung *payload* kredensial saat pengguna mencoba masuk (login).
*   **Properti:** `email` (String) dan `password` (String).
*   **Alur & Penggunaan:**
    *   Di-parsing pada endpoint `POST /api/auth/login` menggunakan anotasi `@RequestBody`.
    *   Spring Security meneruskannya ke `AuthenticationManager`. Jika Bcrypt cocok dan akun aktif, server akan menerbitkan (generate) Token JWT.

### `RegisterRequestDTO.java`
*   **Fungsi:** DTO form data pendaftaran akun baru, dilengkapi penjaga pintu gerbang berupa validasi ketat.
*   **Validasi (Jakarta Validation):**
    *   `@NotBlank` pada `name` untuk menjamin spasi kosong ditolak.
    *   `@Email` pada `email` untuk menjamin struktur harus berformat `user@domain.com`.
    *   `@Size(min = 8)` pada `password` untuk memaksa keamanan sandi minimal 8 karakter.
*   **Alur & Penggunaan:**
    *   Digunakan di `POST /api/auth/register`. Anotasi `@Valid` di parameter Controller akan memicu Spring Boot memvalidasi JSON. 
    *   Jika lolos validasi, password di-hash secara *one-way* menggunakan `PasswordEncoder` sebelum identitas disuntikkan ke Entitas `User` JPA dan disimpan.

### `UserDTO.java`
*   **Fungsi:** Objek aman untuk menyajikan detail profil user ke client.
*   **Properti:** `id`, `name`, `email`, `role`, `createdAt`.
    *   *(Catatan Penting: Field `password` secara konseptual dan struktural dihilangkan untuk keamanan).*
*   **Alur & Penggunaan:**
    *   Saat request `GET /api/users/me` dijalankan, server membaca JWT, menarik entitas asli `User`, dan memindahkannya ke `UserDTO` agar Frontend bisa menampilkannya di halaman profil.

---

## 3. Product (Katalog Produk)

### `ProductRequestDTO.java`
*   **Fungsi:** Payload mutasi data produk, digunakan khusus oleh Admin saat membuat (`POST`) atau mengubah (`PUT`) data produk.
*   **Validasi & Properti:**
    *   `category`: Konseptual tipe string (ActionFigure, Outfit, Manga, BluRay).
    *   `price`: Menggunakan tipe moneter `BigDecimal`. Divalidasi ganda dengan `@DecimalMin(value = "0.01")` untuk menjamin Admin tidak secara sengaja atau tidak sengaja memasukkan harga gratis/minus.
    *   `stockQuantity`: Divalidasi `@Min(value = 0)` (tidak boleh minus).
*   **Alur:** Hanya berjalan pada *endpoint* ber-otoritas Admin.

### `ProductDTO.java`
*   **Fungsi:** Versi *Read-Only* dari katalog produk untuk disajikan kepada publik (pengunjung website/User biasa).
*   **Alur:** Memisahkan metadata yang tidak perlu diketahui pengguna. Semua API katalog `GET /api/products` mengembalikan himpunan `List<ProductDTO>`.

---

## 4. Discount (Manajemen Diskon)

### `DiscountRequestDTO.java`
*   **Fungsi:** DTO komprehensif bagi Admin untuk mengatur rilis kupon diskon baru.
*   **Properti & Perilaku:**
    *   `discountType`: Bisa disetel `Percentage` (potongan rasio, misal 10%) atau `Fixed` (potongan nominal mati, misal Rp 50.000).
    *   `discountValue`: Angka/nominal potongannya (`BigDecimal`).
    *   `maxUsage`: Integer kuota klaim. Jika `null`, artinya unlimited.
    *   `expiryDate`: Batas waktu validitas kupon.
*   **Alur:** Hanya digunakan di fitur CMS (Content Management System) Admin.

### `DiscountResponseDTO.java`
*   **Fungsi:** Mengekspos informasi kupon yang aman ke ranah publik.
*   **Alur:** Seringkali menyembunyikan ID Primary Key database, memberikan balasan bersih yang digunakan keranjang belanja Frontend untuk memverifikasi apakah sebuah `code` diskon aktif.

---

## 5. Order (Pesanan Reguler)

### `OrderRequestDTO.java`
*   **Fungsi:** Pusat data transaksional dari client saat menekan tombol "Checkout / Bayar".
*   **Properti:**
    *   `items`: Kumpulan (List/Array) dari `OrderItemRequestDTO`.
    *   `discountCode`: Kode kupon opsional (String).
*   **🔥 Aspek Keamanan Kritis:** DTO ini sengaja **TIDAK memiliki** properti `userId`. Ini adalah strategi proteksi *Secure by Design* terhadap IDOR. Identitas *Payer* (pembeli) diekstraksi 100% secara server-side dari Token JWT.
*   **Alur Bisnis:**
    1. Payload masuk.
    2. Server memvalidasi ketersediaan stok tiap item di DB (harga diambil dari DB server, BUKAN dari request client).
    3. Kalkulasi kode diskon dijalankan di memori server.
    4. Menyimpan Invoice.

### `OrderItemRequestDTO.java`
*   **Fungsi:** Entitas keranjang yang mewakili *single item* beserta kuantitasnya.
*   **Validasi Kritis:** Properti `quantity` diproteksi menggunakan `@Min(value = 1)`. Tanpa validasi ini, *hacker* dapat mengisi kuantitas `-10` untuk mengacaukan atau mengurangi total biaya order (*underflow attack*).

### `OrderResponseDTO.java`
*   **Fungsi:** Dokumen Nota/Invoice digital *read-only* bagi konsumen.
*   **Properti:** Merangkum `orderId`, `totalAmount` (Bruto sebelum potong), `finalAmount` (Neto setelah potong kupon), dan `status` (`PENDING/PAID/SHIPPED`).

---

## 6. Custom Order (Layanan Spesial 3D & Outfit Cosplay)

### `CustomOrderRequestDTO.java`
*   **Fungsi:** Menampung spesifikasi tingkat lanjut untuk pesanan yang bersifat tidak siap-stok (harus dicetak/dibuat).
*   **Properti:**
    *   `serviceType`: `AF_3D` (Action Figure) / `Outfit`.
    *   `imageReferenceUrl`: URL referensi visual (umumnya dari *Cloudinary*).
    *   `configurationJson`: Metadata *schemaless* berbasis JSON (misal: rasio tinggi 3D, bahan kain cosplay, dll).
*   **🔥 Aspek Keamanan Kritis:**
    *   Selain tanpa `userId`, DTO ini **SAMA SEKALI TIDAK MEMILIKI properti `price` (Harga)**.
    *   **Alasan:** Harga jasa Custom tidak dapat diotomatisasi client. Mengizinkan `price` dikirim dari JSON client membuka celah penipuan. Harga baru bisa lahir jika Admin meninjau `configurationJson` lalu meng-update nilainya melalui endpoint terpisah (`PATCH /admin/custom-orders/{id}/price`).

### `CustomOrderResponseDTO.java`
*   **Fungsi:** Merangkum siklus persetujuan dan status pembuatan *Custom Order*.
*   **Alur:** Digunakan saat user melacak progres, properti `status` akan berubah dari `PENDING` -> `REVIEWING` -> `ACCEPTED` (beserta munculnya Harga `price` resmi dari Admin) -> lalu user melunasinya menjadi `PAID`. DTO mendatarkan (flatten) seluruh kompleksitas ini agar dapat dicerna oleh Frontend.
