# 🛠️ Rencana Eksekusi Perbaikan Menyeluruh Pra-Produksi (Repair MN)

Dokumen ini adalah cetak biru teknis langkah-demi-langkah *(step-by-step)* untuk membereskan 6 kekurangan arsitektur backend yang disebutkan dalam daftar evaluasi Pra-Produksi. Semua diurutkan berdasarkan skala prioritas dan resiko teringgi.

---

## 🚦 Fase 1: Sterilisasi Kredensial & Validasi Celah Lanjutan (Prioritas Tinggi)

### Langkah 1.1: Pembersihan Rahasia Hardcode (`application.yml` & `JwtUtil.java`)
- **Aksi 1**: Mengedit struktur `application.yml`. Ganti nilai tekstual `username: sa` dan `password: password` dengan interpolasi parameter OS, contohnya:
  ```yaml
  spring:
    datasource:
      url: ${DB_URL:jdbc:sqlserver://localhost:1433;...}
      username: ${DB_USERNAME:sa}
      password: ${DB_PASSWORD:password}
  ```
- **Aksi 2**: Pindahkan `SECRET_KEY_STRING` dari dalam kelas Java `JwtUtil.java` menuju *Variables* konfigurasi spring. Tangkap nilai tersebut kembali dengan anotasi `@Value("${jwt.secret}")`.

### Langkah 1.2: Pemasangan Dependency Validator (`pom.xml`)
- **Aksi**: Tambahkan rujukan ekstensi *Hibernate Validator* ke dalam `<dependencies>`.
  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>
  ```

### Langkah 1.3: Inspeksi Data Objek DTO
- **Aksi**: Mendatangi setiap _Data Transfer Object_ (Misal: `LoginRequestDTO`, `OrderRequestDTO`), dan pasangkan benteng pertahanan tipe:
  - `@NotBlank` untuk email dan sandi.
  - `@Min(1)` untuk kuantitas produk mencegah input `-10`.
- **Aksi**: Pada semua kelas `...Controller.java`, pasang stempel pelatuk penahanan `@Valid` di dalam parameter `@RequestBody`.

---

## 🚦 Fase 2: Penghematan Memori & Fitur Lengkap (Prioritas Sedang)

### Langkah 2.1: Implementasi API Paging Produk (`ProductService.java`)
- **Aksi**: Modifikasi metode `getAllProducts()` dari memanggil `findAll()` polos menjadi struktur yang menerima utilitas `Pageable` dengan *Page* (halaman ke-X) dan *Size* (jumlah item X per halaman).
- **Aksi**: Sesuaikan antarmuka rute di `ProductController` agar menangkap *query parameter* HTTP seperti `?page=0&size=10`.

### Langkah 2.2: Rute Riwayat Order Klien (`OrderController.java`)
- **Aksi**: Di ranah `OrderRepository.java`, tambahkan `List<Order> findByUserId(Integer userId)`.
- **Aksi**: Ciptakan Endpoint `GET /api/v1/orders/me` yang dapat mengekstrak `email` pengguna yang sedang mengakses dari Token JWT rahasia mereka (mendayagunakan `SecurityContextHolder`). Setelah User dikalkulasi silang secara sah, kembalikan tabel riwayat pesanan khusus miliknya saja.

---

## 🚦 Fase 3: Transisi Cloud & Server Portability

### Langkah 3.1: Abstraksi Lokasi File AWS S3 Mock (`ImageUploadController.java`)
- **Aksi**: Pisahkan tanggung jawab Controller. Ciptakan *Class* lapisan baru `StorageService.java`. Pindahkan logika penyimpanan ke sana.
- Meskipun saat ini mungkin kita belum punya kredensial Amazon nyata, namun arsitektur kode penyimpanan *(Interface)* di dalam kelas layanan harus sudah kokoh, sehingga sistem awan bisa dicolok sewaktu-waktu tanpa membongkar Controller API.

### Langkah 3.2: Pembungkusan Proyek menjadi Skrip Docker (`Dockerfile`)
- **Aksi**: Di folder pondasi utama (`c:\Antigravity\A2\backend\`), buat file statis murni bernama `Dockerfile` (Tanpa Ekstensi Murni).
- **Aksi**: Set *base image* bertolak pada `openjdk:21-slim`, lakukan instruksi *COPY* file `target/*.jar`, dedikasikan keterbukaan `EXPOSE 8321`, dan rancang _Entrypoint Command_ operasional.

---

**Selesai**. Dengan tereksekusi paripurnanya 3 Fase ini, kode akan otomatis memegang kredibilitas taraf *Enterprise*. Seluruh kejanggalan dalam status pra-Rilis akan dilenyapkan.
