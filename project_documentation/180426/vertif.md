# Hasil Analisis Backend & Database E-Commerce Otaku

Berdasarkan analisis antara struktur database (DDL, ERD, Mock Data) dan source code backend (Spring Boot) yang ada pada direktori `backend`, berikut adalah kesimpulan mengenai kekurangan implementasi backend agar dapat berjalan lancar dengan databasenya.

## 1. Kesesuaian Entity dengan Database (Sudah Baik)
Pemetaan antara tabel database (SQL Server) dengan kelas `@Entity` pada package `entity` sudah komprehensif dan sesuai.
*   Tabel `Users` dipetakan ke `User.java`.
*   Tabel `Products` dipetakan ke `Product.java`.
*   Tabel `Orders` dipetakan ke `Order.java`.
*   Tabel `OrderItems` dipetakan ke `OrderItem.java`.
*   Tabel `CustomOrders` dipetakan ke `CustomOrder.java`.
*   Tabel `Discounts` dipetakan ke `Discount.java`.

Package `repository` yang berisi antarmuka Spring Data JPA untuk setiap entitas di atas juga sudah tersedia dengan lengkap.

## 2. Kekurangan dan Celah pada Backend
Meskipun pondasi entitas dan repositori sudah ada, backend **sama sekali belum siap** untuk melayani koneksi fungsional (business logic) karena komponen arsitektur MVC / REST API masih belum lengkap.

Berikut adalah daftar kekurangan utama yang harus segera dibuat:

### A. Ketiadaan Layer Layanan (Service Layer)
Saat ini package `service` sama sekali belum ada. Repositori tidak seharusnya digabungkan langsung dengan Controller. Diperlukan layer Service untuk menangani *business logic*, antara lain:
*   **`ProductService`**: Untuk melayani query katalog produk (kategori Reguler, Manga, Action Figure).
*   **`OrderService`**: Sangat krusial untuk logika *checkout*, perhitungan total akhir belanja, dan status.
*   **`DiscountService`**: Untuk mengecek validitas kode promosi (misal: "DISC300K" atau "OTAKUNEW") dan menghitung potongan harga sebelum *checkout* final.
*   **`CustomOrderService`**: Untuk menyimpan data konfigurasi JSON (ukuran, pose 3D, atau custom gambar baju).
*   **`AuthService` / `UserService`**: Menangani registrasi, *hashing* password, dan login.

### B. Controller REST API Masih Kosong
Hanya terdapat `ImageUploadController.java` di dalam *package* `controller`. Aplikasi sama sekali belum terekspos ke frontend via rute API. Perlu dibuat kelas Controller berikut:
*   **`ProductController`** (`/api/v1/products`)
*   **`OrderController`** (`/api/v1/orders`)
*   **`AuthController`** (`/api/v1/auth`)
*   **`DiscountController`** (`/api/v1/discounts`)

### C. Tidak Ada Data Transfer Object (DTO)
Aplikasi masih kehilangan *package* `dto` (Data Transfer Object). Menerima beban JSON secara langsung menggunakan kelas *Entity* dari Spring Hibernate berisiko tinggi. Dibutuhkan *record* atau *class* DTO seperti `OrderRequestDTO`, `LoginDTO`, dan `CustomOrderPayloadDTO`.

### D. Ketiadaan Keamanan (Spring Security / JWT)
Di database telah didesain struktur sandi atau `PasswordHash` dan akses `Role` (Admin/Customer). Namun tidak ditemukan jejak konfigurasi penganan otentikasi. Diperlukan implementasi `SecurityFilterChain` dari Spring Security beserta pemrosesan JWT.

## Rekomendasi Langkah Selanjutnya
1.  Buat package `service` dan `dto`.
2.  Implementasikan logika `OrderService` untuk kalkulasi *Cart* + Diskon.
3.  Lengkapi *Controller* REST agar React JS dapat melakukan pemanggilan `fetch()` dengan lancar.
4.  Konfigurasikan Spring Security agar peran Admin dan Customer berfungsi sebagaimana mestinya (terlihat pada tabel Mock Data DB).
