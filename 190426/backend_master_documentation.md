# 📖 Master Architecture Blueprint & Documentation 
**Project:** Otaku E-Commerce Backend API  
**Status:** Secured & Production-Ready  

Dokumen ini adalah *"Master Blueprint"* yang merangkum keseluruhan dokumentasi arsitektur final dari *backend* aplikasi Otaku E-Commerce. Sistem telah mencakup alur komersial reguler, layanan *custom 3D figure/outfit*, dan tameng keamanan khusus berlapis.

---

## 🏗️ 1. Teknologi Dasar (Tech Stack)
* **Programming Language**: Java 21
* **Framework Utana**: Spring Boot 3.2.4
* **Database Relasional**: Microsoft SQL Server
* **Persistensi Data**: Spring Data JPA (Hibernate)
* **Autentikasi & Otorisasi**: Spring Security 6 + JSON Web Token (JJWT)
* **Security & DDoS Prevention**: Bucket4j (Rate Limiting)
* **Migrations**: Flyway SQL Server *(Tersedia dalam dependencies)*

---

## 🏛️ 2. Topologi & Arsitektur Lapisan (Layered Architecture)
Sistem ini memisahkan logika ke dalam beberapa gerbang secara ketat agar kode tidak _spaghetti_ dan mudah diuji.
1. **Controller Layer (`com.otaku...controller`)**: Bertindak murni sebagai pengurai *HTTP Request*. Semua data balik harus dibungkus dalam entitas _DTO_ (Data Transfer Object) seperti `OrderResponseDTO`, bukan mengembalikan Objek Database (JPA) langsung untuk mencegah _Data Exfiltration_.
2. **Security & Exception Layer(`security` & `exception`)**: Pasukan garda depan. *GlobalExceptionHandler* menyembunyikan stack jejak SQL mentah. *RateLimitFilter* menghadang spam.
3. **Service Layer (`service`)**: Lapisan di mana kalkulasi bisnis, potongan harga, dan algoritma *hashing* bcrypt dieksekusi.
4. **Repository Layer (`repository`)**: Penghubung langsung ke SQL Server yang otomatis dikerjakan lewat abstraksi antarmuka `JpaRepository`.

---

## 🗄️ 3. Master Domain & Database (Entity Relational)

| Entitas | Peran dalam Bisnis | Karakteristik Kunci |
| :--- | :--- | :--- |
| **`User`** | Akun pengguna utama. | Password di-*hash* via Bcrypt gabungan, diamankan _serializer_ menggunakan `@JsonIgnore`. `Role` menentukan hak akses (Admin/Customer). |
| **`Product`** | Inventaris reguler. | Mencakup barang *read-made* seperti Manga, BluRay, Action Figure biasa. |
| **`Discount`** | Kupon Potongan Harga. | Dapat berbasis Nilai Tetap (Rp) atau Persentase (%). Disambungkan di Service OrderCheckout. |
| **`CustomOrder`** | Blueprint milik Pelanggan. | Menyimpan referensi URL lampiran gambar + JSON koordinat (*mockup x,y* canvas) desain 3D AF/Baju dari Web Frontend. |
| **`Order`** | Keranjang & Transaksi Akhir. | Payung seluruh belanjaan pengguna. Mengkalkulasi `TotalAmount` lalu `FinalAmount` dari kumpulan item dan Diskon. Menyimpan data pengiriman (`CourierCode`, `TrackingNumber`). |
| **`OrderItem`** | Detail Keranjang. | Menyambungkan struk dari `Order` secara bercabang ke **Product (Reguler)** ATAUPUN **CustomOrder (Kustom)**. |
| **`OrderTracking`** | Riwayat Pelacakan. | Menyimpan log kronologis status pengiriman berdasarkan API pihak ketiga (BinderByte). |

---

## 🛡️ 4. Arsitektur Keamanan (Security Masterplan)

Berdasarkan *Patch* keamanan terakhir, *Backend* ini dijaga oleh 4 Pilar Keamanan:
1. **DDoS & Brute-Force Wall (`RateLimitFilter.java`)**: 
   Semua request yang mengarah ke pintu gerbang `/api/v1/auth/login` dicegat sebelum mencapai filter lain. Dengan algoritma `Bucket4j`, IP yang melebihi beban **5 request / 1 Menit** seketika dibolak melalui respon *HTTP 429 Too Many Requests*.
2. **Stateless JWT Guard (`JwtAuthenticationFilter.java`)**:
   API Order dan Kustom tidak dapat diakses tanpa token ber-klaim dari header `Authorization: Bearer <token>`.
3. **Secure Auth Calculator (`AuthService.java`)**:
   Tidak ada toleransi komparasi manual String untuk _password_. Kode dituntut murni melewati injektor `passwordEncoder.matches` atau otomatis gugur.
4. **Blind-Folded Error Handlers (`GlobalExceptionHandler.java`)**:
   Kesalahan yang dipicu oleh kerusakan/hacker dalam kueri hanya dikembalikan secara aman dalam format `ApiResponse` statis (`"Terjadi kesalahan tak terduga pada server"`). Detail bocoran kueri dialirkan tersembunyi ke terminal via SLF4J (`logger.error`).

---

## 📡 5. Peta Konfigurasi Endpoint (API Router Map)

Pemetaan izin rute bersandar penuh pada *Rules* di `SecurityConfig.java`:

- **Akses Publik (Permit All)**
  - `POST /api/v1/auth/login` (Auth - _Protected by Rate Limit_)
  - `POST /api/v1/auth/register` (Registrasi Akun)
  - `GET /api/v1/products/**` (Lihat Etalase Barang)
  - `GET /api/v1/discounts/**` (Cek Kupon Tersedia)
  - `GET /api/v1/shipping/**` (Cek Daftar Kota & Kalkulasi Ongkir via BinderByte)
  - `GET /api/v1/tracking/**` (Lacak Status Resi Pengiriman)

- **Akses Autentikasi (Membutuhkan JWT valid: Roles Admin/Customer)**
  - `POST /api/v1/orders` (Memproses Pemesanan Check-Out Keranjang)
  - `POST /api/v1/custom-orders` (Menyerahkan blueprint desain 3D AF / Layout Baju)
  - `GET /api/v1/orders/**` dsb.

## 🏁 6. Deployment Readiness
Sistem terverifikasi siap untuk tahap *Staging/Production*. 
- **Start-up Command**: Gunakan `mvnw spring-boot:run` (Lokal) atau bungkus proyek dan `java -jar target/ecommerce-backend-0.0.1-SNAPSHOT.jar` pada VM Server.
- **Environment Variables**: Keamanan optimal pada kluster industri diwajibkan. Pastikan properti SQL (URI/Passwords), JWT Secret, dan API Keys (seperti `BINDERBYTE_API_KEY`) diatur melalui *System Environment Variables*. Gunakan file `.env.example` di root proyek sebagai *template* pedoman untuk tim DevOps.
