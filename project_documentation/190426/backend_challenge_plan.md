# Otaku E-Commerce Backend Challenge

## 1. Latar Belakang Challenge
Tantangan ini bermaksud menguji kemampuan Anda dalam mendesain sebuah sistem backend *E-Commerce* yang stabil dan aman menggunakan ekosistem Java. Sistem yang dibangun bukan sekadar aplikasi toko online konvensional, melainkan juga harus dapat memfasilitasi bisnis "Custom 3D Action Figure" dan desain "Custom Outfit" yang melibatkan penyimpanan koordinat render dari klien.

Selain kemampuan teknis untuk mengimplementasikan *business logic* kompleks, evaluasi tantangan ini sangat menitikberatkan pada aspek mitigasi celah keamanan (data leak), efisiensi query, dan penerapan *best practices* dalam struktur Data Transfer Object (DTO).

## 2. Arsitektur dan Teknologi
Peserta diwajibkan menggunakan struktur standar industri:
- **Database Server**: Microsoft SQL Server
- **Framework Utama**: Spring Boot (Java)
- **Persistensi Data (ORM)**: Spring Data JPA / Hibernate
- **Keamanan**: Spring Security + JWT Authentication
- **Struktur Kode**: Layered Architecture terpisah secar jelas (Controllers, DTOs, Services, Repositories, Exceptions).

---

## 3. Spesifikasi Skema Database (Wajib)
Sistem harus mengimplementasikan tabel-tabel berikut dengan struktur Entity Relationship yang benar:

1. **Users**
   - Atribut: `UserID` (PK), `Name`, `Email`, `PasswordHash`, `Role` (Admin/Customer), `CreatedAt`
   - Syarat: Email bernilai unik.
2. **Products (Katalog Reguler)**
   - Atribut: `ProductID` (PK), `Category` (ActionFigure, Outfit, dll), `Name`, `Description`, `Price`, `StockQuantity`, `ImageURL`
3. **Discounts (Kupon & Promosi)**
   - Atribut: `DiscountID` (PK), `Code`, `DiscountType` (Percentage / Fixed), `DiscountValue`, `ApplicableCategory`
4. **CustomOrders (Pesanan Kustomisasi User)**
   - Atribut: `CustomOrderID` (PK), `UserID` (FK), `ServiceType` (AF_3D / Outfit), `ImageReferenceURL`, `ConfigurationJSON` (Koordinat X, Y, Skala mockup), `Price`, `CreatedAt`
5. **Orders (Keranjang & Transaksi Akhir)**
   - Atribut: `OrderID` (PK), `UserID` (FK), `TotalAmount`, `DiscountID` (FK - Opsional), `FinalAmount`, `Status` (Pending/Paid), `CreatedAt`
6. **OrderItems (Detail Item)**
   - Atribut: `OrderItemID` (PK), `OrderID` (FK), `ProductID` (FK - Opsional), `CustomOrderID` (FK - Opsional), `Quantity`, `UnitPrice`

**Note Mapping JPA**:
- Pastikan relasi antara OrderItems dengan Product / CustomOrders didefinisikan dengan nullable constraint yang tepat.
- Relasi User ke entity terkait sebaiknya memakai asersi `FetchType.LAZY` yang ditangani secara benar agar performa optimal saat query database bertambah besar.

---

## 4. Requirement Fungsional & API Endpoints

### A. Autentikasi dan Manajemen Sesi (Auth Service)
- Buat *endpoint* `POST /api/v1/auth/login` yang mereturn token JWT bagi pengguna valid.
- **Tantangan Mutu Kode**: 
  - Tidak boleh ada "swallowed exception" / tangkapan eror kosong (`catch (Exception e) {}`) dalam eksekusi verifikasi _Password Encoder_.
  - Lakukan reduksi *database hit*. Pastikan operasi `login` tidak melakukan query `findByEmail` ganda / duplikat ketika men-_generate_ token setelah validasi berhasil.

### B. Modul Custom Order (CustomOrderController)
- Buat *endpoint* `POST /api/v1/custom-orders` untuk mencatat rancangan kustom (*blueprint*).
- **Tantangan Keamanan Sengit (Jackson Bug Fix)**: 
  - Peserta **DILARANG KERAS** mengembalikan objek Entitas/Domain database langsung via `ResponseEntity.ok()`.
  - Jika ini dibiarkan, serialisasi Jackson pada Hibernate Proxy berisiko memunculkan `500 Server Error` (*InvalidDefinitionException*) atau parahnya: **Kebocoran relasi kolom password User** ke dalam payload JSON response.
  - *Mitigasi Wajib*: Harus mengembalikan representasi di `CustomOrderResponseDTO.java` dan membubuhkan mitigasi `@JsonIgnore` pada hash database User.

### C. Alur Checkout & Kalkulasi Diskon Otomatis
- Proses pembuatan Order (`POST /api/v1/orders`) wajib memfasilitasi gabungan antara pembelian produk reguler, produk ID kustom, maupun input kode diskon.
- Lakukan branch logic untuk tipe diskon: jika *Percentage* potong secara relatif, jika *Fixed* potong secara nominal (Rp).

### D. Keamanan Data Input Layer
- Setiap payload DTO (`RequestDTO`) di masing-masing endpoint harus dienkapsulasi dan di-validasi ketat dengan anotasi Hibernate Validator seperti `@NotBlank`, `@NotNull`, dan `@Min(1)`.
- Request tak logis seperti order ber-kuantitas negatif (-5) tidak boleh sampai menyentuh *Service Layer*.

---

## 5. Requirement Non-Fungsional

### A. Centralized Logging & Exception Handling
- Harus menyediakan penangkap *Error* bersentral dengan mendayagunakan `@RestControllerAdvice`.
- **Tantangan Information Leak**: Database runtime error, trace SQL syntax, atau SQLException gagal _Constraint_ sama sekali tidak boleh keluar melalui pesan response JSON `ex.getMessage()` ke _Client-Side_.
- Sembunyikan *exception message details* internal. Cukup returkan *"Terjadi kesalahan tak terduga"*, lalu gunakan Logback / SLF4J untuk mencatat *trace* spesifiknya diam-diam ke log konsol backend Anda.

### B. Konfigurasi Rahasia di `application.yml`
- Kredensial *database* SQL Server (seperti _username_, atau _password_ `sa`) **dilarang** diketik langsung di file properties (*hardcode*). 
- Konfigurasikan file env atau property placeholder seperti `spring.datasource.password=${DB_PASSWORD}`.

---

## 6. Kriteria Kelulusan (Definition of Done)
1. **Zero Data Leak**: Entitas pengguna tidak ter-ekspos ke luar (khususnya field password). Tidak ada *StackTrace* database memalukan yang keluar ke layar Rest Client (Postman).
2. **Stable Checkout Math**: Persentase diskon keranjang dan final *payment checkout* menghasilkan nilai desimal komputasi yang persis tanpa bug.
3. **Optimized Auth**: Cukup sekali query database saat mengekstrak User terkait ketika proses autentikasi (Login => Validasi => Generate Token).
4. **Solid Request Validation**: Validasi DTO berhasil menolak payload ilegal di pintu gerbang Controller.
