# 🏗️ Blueprint & Implementation Plan: Otaku E-Commerce Backend & Database

Dokumen ini merupakan spesifikasi teknis dan panduan pengerjaan (*blueprint*) untuk membangun sistem backend "Otaku E-Commerce" beserta databasenya dari titik nol agar menghasilkan identitas sistem, fitur, serta ketahanan keamanan yang sama persis dengan sistem yang berjalan saat ini.

---

## 1. Arsitektur Dasar & Teknologi
- **Database**: Microsoft SQL Server
- **Platform**: Java 17+ (Spring Boot 3.x)
- **Framework & Libraries Terkait**:
  - `spring-boot-starter-web`: Pembuatan REST API
  - `spring-boot-starter-data-jpa`: Mapping Entity (Hibernate) ke SQL Server
  - `spring-boot-starter-security`: Manajemen Akses & Autentikasi
  - `spring-boot-starter-validation`: Pencegahan data kotor di Controller
  - `jjwt` (Java JWT): Generate dan validasi token sesi

---

## 2. Rencana Implementasi Database (SQL Server)

Sistem database mengadopsi 6 tabel utama. Buat dengan DDL (Data Definition Language) mengikuti urutan di bawah untuk menghindari konflik relasi tabel.

### Fase 2.1: Tabel Independen (Master)
1. **Users**
   - Kolom: `UserID` (INT PK IDENTITY), `Name` (NVARCHAR), `Email` (NVARCHAR UNIQUE), `PasswordHash` (NVARCHAR), `Role` (NVARCHAR), `CreatedAt` (DATETIME).
2. **Products** (Katalog Barang Fisik)
   - Kolom: `ProductID` (PK), `Category` (ActionFigure, Outfit, dll), `Name`, `Description`, `Price` (DECIMAL), `StockQuantity` (INT), `ImageURL`.
3. **Discounts** (Sistem Promo)
   - Kolom: `DiscountID` (PK), `Code` (UNIQUE), `DiscountType` (Percentage / Fixed), `DiscountValue` (DECIMAL), `ApplicableCategory`.

### Fase 2.2: Tabel Dependen (Transaksi)
4. **CustomOrders** (Order khusus modifikasi pengguna)
   - Kolom: `CustomOrderID` (PK), `UserID` (FK ke Users), `ServiceType` (AF_3D / Outfit), `ImageReferenceURL`, `ConfigurationJSON` (NVARCHAR MAX), `Price` (DECIMAL), `CreatedAt`.
5. **Orders** (Wadah Induk Keranjang Belanja)
   - Kolom: `OrderID` (PK), `UserID` (FK), `TotalAmount` (DECIMAL), `DiscountID` (FK NULLABLE), `FinalAmount` (DECIMAL), `Status`, `CreatedAt`.
6. **OrderItems** (Rincian Isi Keranjang)
   - Kolom: `OrderItemID` (PK), `OrderID` (FK ke Orders), `ProductID` (FK ke Product, Nullable), `CustomOrderID` (FK ke CustomOrders, Nullable), `Quantity` (INT), `UnitPrice` (DECIMAL).

**Note:** Kolom Nullable di `OrderItems` diimplementasikan karena pelanggan mungkin saja *checkout* barang katalog biasa (`ProductID` terisi, `CustomOrderID` null), atau checkout barang kostumisasi (`ProductID` null, `CustomOrderID` terisi).

---

## 3. Rencana Implementasi Layer Spring Boot

### Fase 3.1: Entitas JPA & Relasi (Model Layer)
- Translasikan seluruh tabel di atas ke dalam File `@Entity` Java.
- **Strategi Lazy Loading**: Pada entitas transaksi (`Order`, `CustomOrder`), buat relasi asosiasi beranotasi terhadap `User` dengan cara `@ManyToOne(fetch = FetchType.LAZY)`. Ini mencegah Hibernate menarik seluruh data *User* tidak perlu.
- **Critical Security Policy**: Pada kelas `User.java`, bubuhkan anotasi `@JsonIgnore` secara wajib persis di atas properti `passwordHash` agar framework JSON tidak akan pernah menyertakannya ketika Objek ditarik ke API Controller.

### Fase 3.2: Konfigurasi Core & Security (`application.yml`)
- **Hindari Hardcode**: Hubungkan URL SQL Server, username, dan password via *Environment Variables*, seperti `url: jdbc:sqlserver://${DB_HOST}; databaseName=${DB_NAME}`.
- Buat sebuah `JwtAuthenticationFilter` yang secara dinamis mengekstrak String `Bearer Token` dari request HTTP header, memverifikasinya, dan memasangnya ke `SecurityContextHolder`.

### Fase 3.3: Layanan Logika Bisnis (Service Layer)
1. **AuthService**
   - Rencana (*Plan*): Saat login diterima, gunakan injeksi `PasswordEncoder` dari Security untuk me-*matches* kecocokan input *password* dengan *hash* database. Jangan telan blok *Exception*.
   - Pencetakan JWT harus dilakukan dalam sequence metode ini menggunakan library klaim HS256, pastikan database hanya di-query memanggil 1 kali eksekusi `findByEmail` untuk validasi beserta token.
2. **OrderService (Checkout Logic)**
   - Rencana Kalkulasi: Sistem harus sanggup mengambil relasi harga original dari entitas bersangkutan -> Mengecek apakah `DiscountID` disertakan -> Mengkondisikan apakah diskon `Percentage` (potongan persen) atau `Fixed` (potongan rupiah tunai) -> Men-simpan `TotalAmount` lalu `FinalAmount`.

### Fase 3.4: Controller Layer & DTO (*Data Transfer Object*)
- **Validasi Input**: Pintu gerbang API di `@RestController` harus diawali dari penerimaan objek JSON bernama `...RequestDTO.java` beserta anotasi stempel `@Valid` dan `@RequestBody`.
- Contoh RequestDTO wajib divalidasi: Atribut harga dipatenkan `@Min(1)`, email diuji dengan `@Email()`.
- **Implementasi Jackson / Anti-Serialization Bug**: Setiap metode POST/GET yang diekspos balik ke browser tidak boleh mereturn entitas (*Data layer*). Buat dan mapping return value hanya kepada kelas khusus `...ResponseDTO.java`. Khususnya pada `CustomOrderController`, mengembalikan Model Proxy JPA asli dapat memicu API _Crash (500 Error)_ pada Jackson parser.

### Fase 3.5: Global Exception Handler
- Integrasikan `@RestControllerAdvice` khusus menanggapi letusan eror Runtime atau SQLException.
- Rencana mitigasi: Tangkap seluruh generalisasi tipe logik *Exception*. Override message internal milik database (untuk menyembunyikan konfigurasi yang terpampang atau trace sql) menjadi balasan ber-struktur standar berupa JSON bersih (cth: kode 500, message *"Terjadi kegagalan pemrosesan sistem"*). Sisi stack trace hanya boleh "dibaca" di lokal log konsol developer melalui SLF4J logger.

---

## 4. Rangkuman Target Akhir Rencana
Dengan menerapkan tahapan dan implementasi arsitektur di atas. Developer akan mendapatkan *source code backend* yang:
1. Memiliki struktur data persis dengan diagram relasional perancangan awal.
2. Bebas dari *Leak Data* (Seperti kebocoran array string sandi hash via JSON serialization).
3. Aman dari tembus ekspektasi trace sistem internal pada Postman/browser.
4. Performa solid berkat pemisahan _DTOs_ dan penekanan query efisien pada *Auth System*.
