# 🚀 Final Project Challenge: Otaku E-Commerce API (Spring Boot + SQL Server)

## 📌 Deskripsi Singkat
Anda adalah seorang **Backend Engineer** yang ditugaskan untuk menyelesaikan sistem *core API* dari "Otaku E-Commerce", sebuah platform toko online unik yang tidak hanya menjual produk anime reguler (manga, blu-ray, action figure), tetapi juga menyediakan **Custom Order** untuk pembuatan 3D Action Figure dan Sablon Outfit pengguna.

Tugas Anda adalah membaca spesifikasi di bawah ini, mengimplementasikan kode dari *scratch*, dan memperbaiki beberapa "Bug Trap" tingkat menengah-tinggi (mid-to-high severity) yang wajib dihindari.

---

## 🎯 Milestones & Tugas (Task List)

### 🔹 Milestone 1: Skema Database (T-SQL)
Sistem menggunakan **SQL Server**. Anda harus membuat DDL (Data Definition Language) berupa `CREATE TABLE` serta menginisiasi beberapa mock data.
**Tugas:**
- Buat tabel `Users`, `Products`, `Orders`, `OrderItems`, `CustomOrders`, dan `Discounts`.
- Pastikan `CustomOrders` memiliki kolom `ConfigurationJSON` untuk menyimpan letak kustomisasi elemen desain dalam format string/Teks panjang.
- Relasikan `Orders` dengan `OrderItems`, di mana sebuah `OrderItem` bisa mensitir ke ID produk **ATAU** ID CustomOrder (Gunakan nullable Foreign Key).

### 🔹 Milestone 2: Setup Spring Boot API & Authentication
**Tugas:**
- Strukturkan project dengan pattern lapisan `Controller`, `Service`, `Repository` (Data JPA), `Entity`, dan `DTO`.
- Integrasikan **Spring Security** beserta **JWT Authentication**.
- **[Kriteria Lulus]**: Akses ke seluruh rute berawalan `/api/v1/orders` dan `/api/v1/custom-orders` harus memvalidasi token dari header `Authorization: Bearer <token>`.
- **[Awass Bug Trap!]**: Ketika mengimplementasikan fitur Sign-in pada `AuthService`, jangan menggunakan `try-catch` blok kosong. Selain itu, pastikan logika pembuatan token setelah *verify* *password* **tidak memberatkan server** dengan cara mengulang query `userRepository.findByEmail(email)`. Cukup optimalkan dalam 1 kali query per request!

### 🔹 Milestone 3: Fitur Produk dan Checkout Reguler
**Tugas:**
- Buat Endpoint RESTful untuk menampilkan katalog `/api/v1/products`.
- Buat Endpoint POST `/api/v1/orders` (Aksi Checkout keranjang belanja).
- Modul *Checkout* pada `OrderService` harus bisa menghitung total harga order beserta kuantiti tiap item.
- Modul harus dapat mendeteksi kupon (Discount percentage atau Fixed price).
- **[Kriteria Lulus]**: Hitung-hitungan math order final harus _accurate_ jika menggunakan persentase diskon 15% dari total belanja Rp450.000. DTO Request Order harus bebas validasi buruk dengan memanfaatkan `@NotNull`, `@Min(1)` dsb pada controller agar mencegah spam.

### 🔹 Milestone 4: Fitur Custom Order & Bug Fixing Kritis
**Tugas:**
- Setup POST `/api/v1/custom-orders` yang divalidasi dengan JWT token. Pengguna *submit* URL Referensi Gambar + JSON *Canvas Blueprint*.
- **[Awass Bug Trap! KRUSIAL]**: Jangan pernah me-return `ResponseEntity.ok(savedCustomOrder);` (Objek JPA Entitas asli) langsung di layer Controller.
  - Implementasikan mapping `CustomOrderResponseDTO` murni!
  - Men-serialize instansiasi Hibernate *Proxy lazy* dapat mengakibatkan `InvalidDefinitionException` 500 Error pada library Jackson.
  - Dan parahnya, ini bisa mengekspos property Object User (termasuk isi column `PasswordHash`) telanjang terekspos keluar. 
- Tambahkan anotasi `@JsonIgnore` secara eksplisit pada entitas `User` di property *password-hash*.

### 🔹 Milestone 5: Exception Handling Global Aman (Anti-Data Lead)
**Tugas:**
- Buat file `GlobalExceptionHandler` menggunakan `@RestControllerAdvice`.
- Misi pada sistem adalah menyamarkan (*Masking*) Original-Exception dari Database. 
- **[Kriteria Lulus]**: Jika user secara jail memasukkan string aneh yang memicu _SQLException_ (seperti melanggar Constraint database), **jangan pernah** menampilkan `ex.getMessage()` berisi sintaks/URI Database. Responslah dengan HTTP 500 JSON cantik dan generik *"Terjadi kesalahan di sistem"* tetapi log error utuhnya ke console internal server (SLF4J/Logback).

---

## 💻 Hasil Akhir (Deliverables)
Peserta dinyatakan **BERHASIL** dalam *Challenge* ini apabila kode diuji menghasilkan:
1. Skema Relasional ter-deploy valid tanpa error referensial di SQL Server.
2. Respons JSON dari `/login` & `/custom-order` super aman dan **bebas kebocoran Data Password**.
3. Tidak ada stack trace yang tembus bocor ke *client / Rest client tools*.
4. Tidak ada Warning di konsol Spring Boot akibat _Lazy-Initialization Proxy_ dari JPA. 
5. Keranjang yang dipotong kode diskon terkalkulasi secara solid.
