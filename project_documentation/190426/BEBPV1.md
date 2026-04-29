# Analisa & Perbandingan: Blueprint vs Implementasi Aktual Backend

Berdasarkan komparasi antara dokumen spesifikasi *blueprint* (`backend_blueprint_implementation_revisi.md`) dengan realita *source code* backend yang telah terpasang di `src/main/java/com/otaku/ecommerce/`, ditemukan sejumlah penyederhanaan yang drastis pada sisi implementasinya.

## 1. Arsitektur & Teknologi

| Aspek Blueprint | Status Implementasi | Catatan Analisa |
|---|---|---|
| Menggunakan `spring-boot-starter-data-redis` | ❌ Tidak Ada | Pada `pom.xml`, dependency Redis tidak ditemukan. Konfigurasi integrasi Redis server dan Blacklisting Service tidak diimplementasikan sama sekali dalam spring context. |
| Penggunaan JJWT api versi `0.12.x` | ⚠️ Berbeda Versi | Diimplementasikan menggunakan *library* `jjwt` versi `0.11.5`. |
| Penggunaan In-memory Cache / Redis Blacklist | ❌ Tidak Ada | Tidak ada Redis instance atau `TokenBlacklistService.java` untuk meng-handle token revocation / token blacklist pasca logout. |

## 2. Struktur Database & Entitas

| Aspek Blueprint | Status Implementasi | Catatan Analisa |
|---|---|---|
| Tabel Pendukung `RefreshTokens` | ❌ Tidak Ada | Entitas `RefreshToken.java` beserta repositorinya sama sekali absen di dalam folder entity dan repository. Hanya tersedia tabel bisnis utama (User, Product, Order, dsb). |
| Relasi Tipe Lazy Loading | ⚠️ Parsial | Entity bisnis (Order, OrderItems, Products) sudah ada, meski eksekusinya butuh penyelarasan lebih rinci terkait parameter validasi ORM. |

## 3. Regulasi Autentikasi dan JWT

| Aspek Blueprint | Status Implementasi | Catatan Analisa |
|---|---|---|
| **Dual Token System** (Access & Refresh) | ❌ Hanya Token Tunggal | Blueprint mensyaratkan integrasi terpisah: *Access Token*(15 menit) dan *Refresh Token* (7 hari). Namun pada `JwtUtil.java`, sistem hanya menetapkan token statis tunggal dengan expiration 24 jam penuh (`EXPIRATION_TIME = 86400000;`). |
| **Adanya Endpoint** (`/refresh` & `/logout`) | ❌ Tidak Ada | Di dalam `AuthController.java`, hanya memfasilitasi endpoint statis `/login` dan `/register`. Perintah logout dan refresh token belum disediakan. |
| **Mekanisme Hashing Password** | ⚠️ Custom (Non-Standard) | Blueprint menuntut pemakaian standard `BCrypt.encode(password)`. Anehnya, `AuthService.java` saat ini menggunakan salting manual berwujud gabungan nilai: `Name + Password + Email` yang baru dihas secara bersamaan. Resikonya, jika pengguna mengubah Nama otomatis user kehilangan akses login. |
| **Rahasia JWT (Secret Key)** | ⚠️ Hardcoded in Source | Seharusnya didesain injeksi berbasis environment variable (`${JWT_SECRET}`). Kini justru ditulis secara terang / hardcoded di `JwtUtil.java` sebagai string `"OtakuEcommerceSuperSecretKey2026!@#$AdvancedSecurityKey"`. |

## 4. Keamanan Berbasis (OWASP Top 10 — 2021 Edition)

> **Referensi:** OWASP (Open Worldwide Application Security Project) menetapkan 10 kategori risiko aplikasi web tertinggi berdasarkan frekuensi dan dampak nyata. Setiap kategori diberi kode **A01–A10**.

| Kode OWASP | Kategori Risiko | Status Implementasi | Analisa vs Blueprint |
|---|---|---|---|
| **A01** | **Broken Access Control** | ⚠️ Parsial | Restriksi di `SecurityConfig.java` hanya bersifat Role-global. Tidak ada `@PreAuthorize` per-metode yang memvalidasi kepemilikan objek. Risiko: User A bisa mengakses `/api/v1/orders/{id}` milik User B hanya dengan menebak ID. Blueprint mewajibkan `OrderSecurityEvaluator` / ownership check di Service layer. |
| **A02** | **Cryptographic Failures** | ❌ Menyalahi Standar | Secret JWT di-*hardcode* sebagai plain string di `JwtUtil.java`. Hashing password menggunakan kombinasi non-standar `(Name + Password + Email)`. Tidak ada `@JsonIgnore` pada field `passwordHash` di entitas `User.java`. Blueprint mensyaratkan injeksi `${JWT_SECRET}` via ENV dan BCrypt murni tanpa salting manual. |
| **A03** | **Injection (SQL / Command)** | ✅ Terlindungi (JPA) | Seluruh query database dilakukan melalui Spring Data JPA (Hibernate), bukan *raw SQL string*. Parameterized query otomatis mencegah SQL Injection. Tidak ada titik rentan yang terdeteksi. |
| **A04** | **Insecure Design** | ⚠️ Desain Tidak Lengkap | Sistem tidak memiliki mekanisme *token rotation* (Refresh Token) dan *token revocation* (Redis Blacklist). Desain single-token 24 jam tidak memiliki lapisan pertahanan jika token bocor. Blueprint menetapkan dual-token + rotation sebagai bagian dari *secure design* inti. |
| **A05** | **Security Misconfiguration** | ⚠️ Ada Celah | `application.properties/yml` tidak ditemukan menggunakan *Environment Variables* secara konsisten. `pom.xml` menggunakan versi JJWT `0.11.5` (bukan `0.12.x` yang direkomendasikan blueprint). CORS dikonfigurasi semi-terbuka (`localhost:5173`, `localhost:3000`) — berisiko jika tidak diubah saat deployment produksi. |
| **A06** | **Vulnerable & Outdated Components** | ⚠️ Versi Usang (Minor) | `jjwt` versi `0.11.5` adalah versi lama; Blueprint mensyaratkan `0.12.x`. Meskipun belum ada *known CVE* kritis pada `0.11.5`, upgrade tetap dianjurkan mengikuti *best practice* pembaruan berkala komponen. |
| **A07** | **Identification & Authentication Failures** | ❌ Kritis — Banyak Kekurangan | Tidak ada Refresh Token → sesi permanen 24 jam tanpa kemampuan revokasi. Tidak ada endpoint `/logout` yang memadai untuk invalidasi token. BCrypt *strength* tidak dikonfigurasi eksplisit (`new BCryptPasswordEncoder()` tanpa parameter rounds ≥ 12). Tidak ada penanganan `BadCredentialsException` yang konsisten antar endpoint. |
| **A08** | **Software & Data Integrity Failures** | ✅ Tidak Relevan / Aman | Tidak ada mekanisme *deserialization* dari input eksternal yang tidak terpercaya. Dependency dikelola via Maven `pom.xml` dari repository resmi. Tidak terdeteksi risiko supply-chain attack atau *auto-update* tanpa validasi. |
| **A09** | **Security Logging & Monitoring Failures** | ⚠️ Terbatas | `GlobalExceptionHandler.java` sudah menggunakan SLF4J logger untuk Exception umum (`logger.error`). Namun, **tidak ada audit logging** untuk event kritis: login berhasil, login gagal, percobaan akses tidak sah, atau pergantian password. Blueprint mewajibkan pencatatan forensik aktivitas autentikasi. |
| **A10** | **Server-Side Request Forgery (SSRF)** | ✅ Tidak Relevan | Backend tidak memiliki fitur yang menerima URL dari input pengguna untuk kemudian diakses server-side (seperti fetch gambar eksternal, webhook, dsb). Risiko SSRF saat ini tidak teridentifikasi dalam arsitektur yang ada. |

---

## 🎯 Kesimpulan & Saran Perbaikan

Backend *Otaku E-Commerce* terkini baru mengambil inti dasar logika bisnis *Spring Boot*, operasional API, serta konfigurasi database JPA biasa. Namun secara **arsitektur keamanan** _(Security Architecture)_, implementasi aktual membuang banyak sekali komponen yang seharusnya diwajibkan oleh *blueprint*:

Sistem ini bersifat "Terlalu Tersederhanakan". Semua kompleksitas Redis, Dual Token Rotation, dan mekanisme *Token Revoking Blacklist* digantikan menjadi JWT standar berumur 24 jam tanpa mekanisme relog/refresh. Metode validasi/hashing custom pada registrasi juga tidak mencerminkan standard best practice konvensional.

## 5. 🛠️ Roadmap & Langkah Implementasi Menuju Blueprint 100%

Untuk menyinkronkan implementasi backend saat ini dengan `backend_blueprint_implementation_revisi.md`, berikut adalah langkah-langkah sistematis yang harus dikerjakan oleh developer:

### Tahap 1: Sinkronisasi Dependency & Konfigurasi Dasar
1. **Update `pom.xml`**:
   - Tambahkan dependency `spring-boot-starter-data-redis` untuk integrasi memori *Token Blacklist*.
   - Perbarui versi `jjwt-api`, `jjwt-impl`, dan `jjwt-jackson` dari versi lawas `0.11.5` ke `0.12.x` sesuai cetak biru.
2. **Setup File Properties (`application.yml`)**:
   - Tambahkan pengaturan konektivitas server Redis (berupa host, port, timeout).
   - Pindahkan *hardcoded* kunci rahasia ke environment variable `${JWT_SECRET}`.
   - Konfigurasi parameter eksposur usia token: `access-token-expiration: 900000` (15 menit) dan `refresh-token-expiration: 604800000` (7 hari).

### Tahap 2: Pembenahan Relasi & Database 
1. **Penciptaan Entitas `RefreshToken.java`**:
   - Tambahkan kelas JPA baru dengan relasi `@ManyToOne` terhadap entitas `User.java`.
   - Bekali propertinya dengan metadata: `tokenId`, `token`, `expiryDate`, `revoked` (boolean), dan `createdAt`.
2. **Penciptaan `RefreshTokenRepository.java`**:
   - Tambahkan _interface_ repositori yang menangani query spesifik seperti pencarian berdasar string token (`findByToken`) serta kemampuan penarikan masal (`revokeAllByUserId`).

### Tahap 3: Pembuatan Sistem Anti-Bocor (Redis Blacklist)
1. **Membuat `RedisConfig.java`**:
   - Persiapkan konfigurasi `RedisTemplate` secara eksplisit menggunakan `StringRedisSerializer` (hal ini krusial agar token masuk ke memori sebagai *plain-text* yang bisa diinspeksi via Redis CLI, bukannya gabungan byte terenskripsi asal).
2. **Membuat Kelas `TokenBlacklistService.java`**:
   - Implementasikan *service class* yang meregulasi penambahan Access Token yang telah usai/login-out ke Redis, sinkronisasikan auto-destroy di Redis berdasarkan injeksi *Time To Live (TTL)* token.

### Tahap 4: Rekonstruksi Filter & Utilitas JWT
1. **Normalisasi `JwtUtil.java` (atau menjadi `JwtService.java`)**:
   - Pecah metode statis menjadi dua aliran: `generateAccessToken` (15 menit masa hidup) dan `generateRefreshToken` (7 hari masa hidup tanpa klaim role/personal berlebihan).
   - Cabut properti `SECRET_KEY_STRING` yang bersifat *hardcoded* statis.
2. **Menulis Ulang `JwtAuthenticationFilter.java`**:
   - Sisipkan (*Inject*) `TokenBlacklistService`.
   - Tambahkan lapisan pengecekan ketiga: selain validasi *signature* dan *expiration date*, periksa string yang datang apakah keberadaannya berstatus eksis di Redis. Tolak request apabila Redis menjawab Positif (artinya token tersebut masuk *blacklisted*).

### Tahap 5: Perbaikan Endpoint Bisnis (Controller & Service)
1. **Standardisasi Keamanan `AuthService.java`**:
   - Buang logika pencampuran hashing eksperimental (`name + password + email`). Format pengamanan BCrypt konvensional (hanya hash dari string password) adalah yang tepat. Pastikan fase `login` dan `register` kembali ke jalur murni *BCrypt*. 
   - Tambahkan blok rotasi *refresh-token*.
   - Rancang aksi eksekusi `logout` di service untuk menarik/void string Access Token ke *Redis Blacklist* serta mengubah properti database `Revoked = true` pada Refresh Token milik user terkait.
2. **Update Rute di `AuthController.java`**:
   - Susun metode API terpusat untuk `/api/v1/auth/refresh` — menukar token lama dengan set kredensial rotasi token baru.
   - Susun metode APi untuk `/api/v1/auth/logout`.
3. **(Opsional) Restrukturisasi Exception (`@RestControllerAdvice`)**:
   - Bangun *GlobalExceptionHandler* agar pesan *Unauthorized/Expired Token* dikeluarkan dengan balasan JSON terkontrol, tanpa menampilkan runut jejak kodingan ke publik ketika sistem gagal membongkar Token/Redis bermasalah.

### Tahap 6: Mitigasi Keamanan OWASP (Prioritas A01 s/d A09)

1. **Mitigasi A01 — Broken Access Control**:
   - Tambahkan `@PreAuthorize("hasRole('Admin') or @orderSecurity.isOwner(#id, authentication.name)")` pada endpoint sensitif di `OrderController`, `CustomOrderController`.
   - Buat `OrderSecurityEvaluator.java` sebagai `@Component` yang berisi metode `isOwner(Long orderId, String email)` untuk memvalidasi kepemilikan objek di database.
   - Tambahkan pengecekan ownership di dalam `OrderService.getOrderById()` sebelum data dikembalikan.

2. **Mitigasi A02 — Cryptographic Failures**:
   - Hapus `SECRET_KEY_STRING` yang di-*hardcode* di `JwtUtil.java`, ganti dengan `@Value("${jwt.secret}")` yang dibaca dari ENV.
   - Buang logika `name + password + email` dari `AuthService`, standardisasi ke `passwordEncoder.encode(rawPassword)` biasa.
   - Tambahkan `@JsonIgnore` di atas field `passwordHash` pada `User.java`.
   - Atur BCrypt strength eksplisit: `new BCryptPasswordEncoder(12)`.

3. **Mitigasi A04 — Insecure Design**:
   - Implementasikan Dual Token System (Access 15 menit + Refresh 7 hari) sesuai detail di Tahap 2–5 roadmap ini.
   - Tambahkan mekanisme Refresh Token Rotation: token lama di-revoke setiap kali refresh berhasil.

4. **Mitigasi A05 — Security Misconfiguration**:
   - Pastikan seluruh nilai sensitif di `application.yml` (DB password, JWT secret, Redis password) **hanya** dibaca dari ENV variable.
   - Perketat konfigurasi CORS saat production: batasi `allowedOrigins` hanya ke domain produksi yang sah.
   - Upgrade `jjwt` ke versi `0.12.x` sesuai blueprint.

5. **Mitigasi A06 — Vulnerable & Outdated Components**:
   - Update versi JJWT di `pom.xml`: `jjwt-api`, `jjwt-impl`, `jjwt-jackson` ke versi `0.12.3` atau lebih baru.
   - Rutinkan pengecekan `mvn dependency:check` atau gunakan Dependabot untuk otomasi deteksi dependency yang usang.

6. **Mitigasi A07 — Identification & Authentication Failures**:
   - Nonaktifkan token permanen 24 jam, ganti ke skema Dual Token (detail Tahap 4 & 5).
   - Implementasikan endpoint `/logout` yang menginvalidasi Refresh Token di database dan Access Token di Redis Blacklist.
   - Seragamkan seluruh pesan error autentikasi menjadi generik (`"Email atau password salah"`) — jangan bedakan antara "user tidak ditemukan" vs "password salah" karena membuka celah *user enumeration*.

7. **Mitigasi A09 — Security Logging & Monitoring Failures**:
   - Tambahkan SLF4J logging di `AuthService.login()` untuk mencatat: IP address peminta, waktu percobaan login, dan status berhasil/gagal.
   - Tambahkan logging di `JwtAuthenticationFilter` setiap kali token tidak valid atau di-*blacklist* terdeteksi.
   - Contoh minimal yang perlu ditambahkan:
   ```java
   // Di AuthService.login() — setelah gagal validasi:
   log.warn("[AUTH-FAIL] Login gagal untuk email={} dari IP={}", dto.getEmail(), request.getRemoteAddr());
   // Di AuthService.login() — setelah berhasil:
   log.info("[AUTH-OK] Login berhasil untuk userId={}", user.getId());
   ```

---

## 6. 🔍 Temuan Keamanan Tambahan (Hasil Analisa Source Code Mendalam)

Selain gap yang sudah teridentifikasi di atas, berikut temuan spesifik dari pembacaan source code yang memperkuat kebutuhan perbaikan segera:

### 6.1 Kerentanan di `OrderRequestDTO.java` — IDOR (Insecure Direct Object Reference)

```java
// OrderRequestDTO.java — Field ini BERBAHAYA:
private Integer userId;  // ← Client mengirim userId sendiri!
```

**Masalah Kritis**: `OrderController.createOrder()` menerima `userId` langsung dari body request JSON yang dikirim client. Artinya, User A (yang sudah login) dapat mengirim `{"userId": 999, ...}` dan membuat order atas nama User 999 tanpa hambatan apapun.

**Solusi**: `userId` **TIDAK BOLEH** ada di request body. Seharusnya diambil dari JWT token yang sudah tervalidasi:
```java
// Di OrderController — ambil userId dari SecurityContext, bukan dari body:
@PostMapping
public ResponseEntity<?> createOrder(@RequestBody OrderRequestDTO request,
                                      Authentication authentication) {
    String email = authentication.getName(); // Dari JWT claims
    // Lalu cari user by email, bukan dari request.getUserId()
}
```

---

### 6.2 Kerentanan di `CustomOrderController.java` — Entitas JPA Bocor Langsung

```java
// CustomOrderController.java — Line 18:
public ResponseEntity<CustomOrder> createCustomOrder(...) {
    CustomOrder savedCustomOrder = customOrderService.saveCustomOrder(request);
    return ResponseEntity.ok(savedCustomOrder);  // ← Return entitas JPA mentah!
}
```

**Masalah**: Mengembalikan objek `CustomOrder` (entitas JPA langsung) ke response API. Ini berisiko:
1. **Data bocor**: Jackson akan mencoba serialisasi seluruh properti entitas termasuk relasi Lazy (`user`, dsb). Dapat memicu `LazyInitializationException` → **HTTP 500 Error** saat context Hibernate sudah ditutup.
2. **Eksposur struktur database internal** ke publik.

**Solusi**: Buat `CustomOrderResponseDTO.java` dan mapping data ke DTO sebelum dikembalikan. Blueprint telah mewajibkan hal ini sejak awal.

---

### 6.3 Celah di `CustomOrderService.java` — Harga Ditentukan Client

```java
// CustomOrderService.java — Line 32:
customOrder.setPrice(request.getPrice());  // ← Harga dikirim oleh client!
```

**Masalah Business Logic Kritis**: Harga `CustomOrder` diambil langsung dari request body (`CustomOrderRequestDTO.getPrice()`). Client dapat memanipulasi nilai harga sebelum dikirim (misalnya mengirim `price: 0`). Tidak ada validasi server-side atau kalkulasi harga dari server.

**Solusi**: Harga custom order harus dikalkulasi atau divalidasi di sisi server berdasarkan `ServiceType` dan `ConfigurationJSON`, bukan dipercaya begitu saja dari input client.

---

### 6.4 Celah di `OrderService.java` — Tidak Ada Validasi Stok Produk

```java
// OrderService.java — Line 67-69:
item.setProduct(product);
item.setUnitPrice(product.getPrice());
totalAmount = totalAmount.add(product.getPrice().multiply(...));
// ↑ TIDAK ADA pengecekan product.getStockQuantity() >= itemDto.getQuantity()!
```

**Masalah**: Sistem memungkinkan pembelian produk dengan stok 0 (atau bahkan stok negatif) karena tidak ada validasi `StockQuantity`. Ini membuat kondisi *overselling* di mana order dibuat tapi stok tidak mencukupi.

**Solusi**:
```java
if (product.getStockQuantity() < itemDto.getQuantity()) {
    throw new CustomBusinessException("OTK-4094", "Stok produk '" + product.getName() + "' tidak mencukupi", 409);
}
// Lalu kurangi stok:
product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
productRepository.save(product);
```

---

### 6.5 Celah di `RateLimitFilter.java` — Rate Limit Hanya di Login, Tidak di Register

```java
// RateLimitFilter.java — Line 38:
if (request.getRequestURI().startsWith("/api/v1/auth/login")) {
    // Rate limit HANYA berlaku untuk login
}
```

**Masalah**: Rate limit `bucket4j` saat ini **hanya** aktif untuk endpoint `/login`. Endpoint `/register` tidak diproteksi, memungkinkan attacker memflood pendaftaran akun palsu (account enumeration via register, spam bot registration).

**Solusi**: Terapkan rate limit juga ke `/api/v1/auth/register` dan `/api/v1/auth/refresh`.

---

### 6.6 Celah di `RateLimitFilter.java` — Bucket Tidak Pernah Dibersihkan (Memory Leak)

```java
// RateLimitFilter.java — Line 22:
private final Map<String, Bucket> cache = new ConcurrentHashMap<>();
```

**Masalah**: `ConcurrentHashMap` yang menyimpan satu bucket per IP **tidak pernah dibersihkan**. Setiap IP unik yang pernah mengakses server akan membuat entry baru yang tidak pernah dihapus → potensi **memory leak** seiring waktu, terutama jika di-hit oleh IP rotator/botnet.

**Solusi**: Gunakan `Caffeine Cache` dengan TTL, atau integrasikan counter ke Redis (yang memang sudah direncanakan di blueprint) agar entry otomatis expired.

---

### 6.7 Celah di `GlobalExceptionHandler.java` — Pesan Error Internal Bocor

```java
// GlobalExceptionHandler.java — Line 24:
ApiResponse<Object> response = ApiResponse.error("OTK-5000", ex.getMessage());
// ↑ getMessage() mengembalikan pesan Exception mentah!
```

**Masalah**: Handler `RuntimeException` mengekspos `ex.getMessage()` langsung ke client. Pesan seperti `"User not found: 42"` atau `"Product not found: 99"` membocorkan informasi struktur internal (keberadaan/ketidakhadiran suatu ID) ke penyerang — pelanggaran langsung terhadap **OWASP A09** dan prinsip *Information Disclosure*.

**Solusi**: Pesan untuk `RuntimeException` umum harus generik: `"Terjadi kesalahan, silakan coba lagi"`. Detail internal hanya dicatat di log server.

---

## 7. 🔄 Celah pada Flow & Logic Bisnis

| # | Lokasi | Masalah Flow / Logic | Tingkat Risiko |
|---|---|---|---|
| 1 | `OrderService.createOrder()` | Order di-`save()` ke database **sebelum** semua item divalidasi. Jika salah satu item gagal di tengah loop, data order kosong sudah tersimpan permanen (partial commit). Butuh strategi rollback penuh via `@Transactional`. | 🔴 Tinggi |
| 2 | `OrderRequestDTO` | `userId` dikirim dari client → celah IDOR, penyalahgunaan identitas user lain. | 🔴 Tinggi |
| 3 | `CustomOrderService` | Harga ditetapkan oleh client tanpa kalkulasi/validasi server-side → price manipulation. | 🔴 Tinggi |
| 4 | `ProductService` | Tidak ada endpoint `GET /products/{id}`, `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}`. Hanya `getAllProducts()` yang ada — manajemen produk oleh Admin tidak tersedia. | 🟡 Sedang |
| 5 | `OrderService` | Tidak ada endpoint `GET /orders/{id}` atau `GET /orders` untuk melihat riwayat order. | 🟡 Sedang |
| 6 | `DiscountService` | Tidak ada validasi batas maksimum pemakaian diskon, masa berlaku diskon, atau kategori produk yang berlaku. Satu kode diskon bisa dipakai tanpa batas oleh siapapun. | 🟡 Sedang |
| 7 | `OrderController` | Tidak ada `@Valid` pada `@RequestBody`. Input seperti `items: []` (list kosong) atau `quantity: -5` tidak ditolak → order dengan 0 item bisa dibuat. | 🟡 Sedang |
| 8 | `AuthController.login()` | Memanggil `userRepository.findByEmail()` **dua kali**: sekali di `authService.login()` dan sekali lagi di `authService.generateTokenForLogin()`. Ini pemborosan query N+1 yang tidak perlu. | 🟢 Minor |
| 9 | `CustomOrderService` | Tidak ada validasi `ServiceType` (hanya menerima string bebas). Nilai tidak valid seperti `"XYZ_INVALID"` akan tersimpan ke database tanpa error. | 🟢 Minor |

---

## 8. 📋 Ringkasan Prioritas Perbaikan (Matriks Final)

| Prioritas | Masalah | File Terdampak | Dampak |
|---|---|---|---|
| 🔴 **P1 — Kritis** | IDOR: `userId` dari request body | `OrderRequestDTO`, `OrderController`, `OrderService` | User bisa checkout atas nama orang lain |
| 🔴 **P1 — Kritis** | JWT Secret hardcoded | `JwtUtil.java` | Secret key dapat dibaca siapapun yang akses repo |
| 🔴 **P1 — Kritis** | Price manipulation custom order | `CustomOrderService`, `CustomOrderRequestDTO` | Client bisa menetapkan harga sendiri (termasuk Rp 0) |
| 🔴 **P1 — Kritis** | Tidak ada logout / token revocation | `AuthController`, `AuthService` | Token tidak bisa diinvalidasi setelah dikeluarkan |
| 🟠 **P2 — Tinggi** | Entitas JPA bocor di response | `CustomOrderController` | Crash 500 akibat Lazy Loading, eksposur struktur DB |
| 🟠 **P2 — Tinggi** | Tidak ada validasi stok produk | `OrderService` | Overselling — order berhasil meski stok habis |
| 🟠 **P2 — Tinggi** | Pesan error internal bocor | `GlobalExceptionHandler` | Information disclosure ke client/penyerang |
| 🟡 **P3 — Sedang** | Rate limit hanya di login | `RateLimitFilter` | Endpoint register/refresh bisa di-spam |
| 🟡 **P3 — Sedang** | Memory leak bucket4j | `RateLimitFilter` | Degradasi performa server jangka panjang |
| 🟡 **P3 — Sedang** | Tidak ada `@Valid` di Controller | `OrderController`, semua Controller | Input kotor (quantity negatif, list kosong) lolos masuk |
| 🟡 **P3 — Sedang** | Double query di login | `AuthService`, `AuthController` | Performa: 2 query DB untuk 1 proses login |
| 🟢 **P4 — Minor** | JJWT versi 0.11.5 | `pom.xml` | Perlu upgrade ke 0.12.x sesuai blueprint |
| 🟢 **P4 — Minor** | ServiceType tidak divalidasi | `CustomOrderService` | Data kotor masuk ke database |

---

## 9. 👑 Admin Flow — Manajemen Sistem (Yang Perlu Dibangun)

Saat ini backend **tidak memiliki satupun endpoint Admin** yang berfungsi. Semua pengelolaan data (produk, order, diskon, user) harus dilakukan langsung ke database. Bagian ini mendefinisikan seluruh Admin flow yang perlu diimplementasikan.

---

### 9.1 Arsitektur Role & Akses Admin

```
┌─────────────────────────────────────────────────────────────┐
│                    HIERARKI AKSES ROLE                       │
│                                                              │
│   ADMIN                                                      │
│     ✅ Semua endpoint Customer                               │
│     ✅ /api/v1/admin/** (khusus admin)                      │
│     ✅ Force logout user                                     │
│     ✅ CRUD produk, diskon, manajemen order                  │
│     ✅ Lihat semua order (bukan hanya miliknya)              │
│                                                              │
│   CUSTOMER                                                   │
│     ✅ /api/v1/orders/** (miliknya saja)                    │
│     ✅ /api/v1/custom-orders/** (miliknya saja)             │
│     ✅ /api/v1/products (GET only)                          │
│     ❌ Tidak bisa mengakses /api/v1/admin/**                │
│                                                              │
│   PUBLIC (No Auth)                                           │
│     ✅ /api/v1/auth/register, login, refresh                │
│     ✅ /api/v1/products GET (katalog publik)                │
└─────────────────────────────────────────────────────────────┘
```

**Perubahan `SecurityConfig.java` yang diperlukan:**
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/discounts/**").permitAll()
    // Admin-only
    .requestMatchers("/api/v1/admin/**").hasRole("Admin")
    .requestMatchers(HttpMethod.POST,   "/api/v1/products").hasRole("Admin")
    .requestMatchers(HttpMethod.PUT,    "/api/v1/products/**").hasRole("Admin")
    .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasRole("Admin")
    .requestMatchers(HttpMethod.POST,   "/api/v1/discounts").hasRole("Admin")
    .requestMatchers(HttpMethod.DELETE, "/api/v1/discounts/**").hasRole("Admin")
    // Customer + Admin
    .requestMatchers("/api/v1/orders/**").hasAnyRole("Customer", "Admin")
    .requestMatchers("/api/v1/custom-orders/**").hasAnyRole("Customer", "Admin")
    .anyRequest().authenticated()
)
```

---

### 9.2 Admin Flow: Manajemen Produk

#### Endpoint yang Perlu Dibuat

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/v1/products` | Lihat semua produk (katalog) | Public |
| `GET` | `/api/v1/products/{id}` | Detail satu produk | Public |
| `POST` | `/api/v1/products` | Tambah produk baru | ✅ ADMIN |
| `PUT` | `/api/v1/products/{id}` | Update data produk | ✅ ADMIN |
| `DELETE` | `/api/v1/products/{id}` | Hapus produk | ✅ ADMIN |
| `PATCH` | `/api/v1/products/{id}/stock` | Update stok saja | ✅ ADMIN |

#### Flow Tambah Produk Baru

```
Admin ──POST /api/v1/products──> ProductController
        Body: { name, category,        │
                price, stockQuantity }  │
                                        ├─ @PreAuthorize("Admin") ✓
                                        ├─ @Valid → price > 0, stock >= 0
                                        │
                                        ├──> ProductService.createProduct()
                                        │         │
                                        │         └──> INSERT Products → DB
                                        │
                               HTTP 201 Created
                               { productId, name, price, ... }
```

```java
// Tambahkan ke ProductController.java:
@PostMapping
@PreAuthorize("hasRole('Admin')")
public ResponseEntity<ApiResponse<ProductDTO>> createProduct(
        @Valid @RequestBody ProductRequestDTO request) {
    ProductDTO created = productService.createProduct(request);
    return ResponseEntity.status(201)
        .body(ApiResponse.success("OTK-2021", "Produk berhasil ditambahkan", created));
}

@PutMapping("/{id}")
@PreAuthorize("hasRole('Admin')")
public ResponseEntity<ApiResponse<ProductDTO>> updateProduct(
        @PathVariable Integer id, @Valid @RequestBody ProductRequestDTO request) {
    ProductDTO updated = productService.updateProduct(id, request);
    return ResponseEntity.ok(ApiResponse.success("OTK-2022", "Produk diperbarui", updated));
}

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('Admin')")
public ResponseEntity<ApiResponse<Object>> deleteProduct(@PathVariable Integer id) {
    productService.deleteProduct(id);
    return ResponseEntity.ok(ApiResponse.success("OTK-2023", "Produk dihapus", null));
}

@PatchMapping("/{id}/stock")
@PreAuthorize("hasRole('Admin')")
public ResponseEntity<ApiResponse<Object>> updateStock(
        @PathVariable Integer id, @RequestParam Integer quantity) {
    productService.updateStock(id, quantity);
    return ResponseEntity.ok(ApiResponse.success("OTK-2024", "Stok diperbarui", null));
}
```

---

### 9.3 Admin Flow: Manajemen Order

#### Endpoint yang Perlu Dibuat

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/v1/admin/orders` | Lihat SEMUA order semua user | ✅ ADMIN |
| `GET` | `/api/v1/admin/orders/{id}` | Detail order manapun | ✅ ADMIN |
| `PATCH` | `/api/v1/admin/orders/{id}/status` | Update status order | ✅ ADMIN |
| `GET` | `/api/v1/orders` | Lihat order milik sendiri | ✅ CUSTOMER |
| `GET` | `/api/v1/orders/{id}` | Detail order (validasi kepemilikan) | ✅ CUSTOMER / ADMIN |

#### Flow Update Status Order

```
Admin ──PATCH /admin/orders/42/status──> AdminOrderController
        Body: { "status": "Shipped" }          │
                                                ├──> OrderService.updateOrderStatus(42, "Shipped")
                                                │         │
                                                │    ┌────┴──────────────────────────────┐
                                                │    │ Validasi transisi status:          │
                                                │    │ Pending → Processing / Cancelled  │
                                                │    │ Processing → Shipped / Cancelled  │
                                                │    │ Shipped → Completed               │
                                                │    │ Completed / Cancelled → (final)   │
                                                │    └────┬──────────────────────────────┘
                                                │         └──> UPDATE Orders SET Status = ?
                                               HTTP 200 { orderId, newStatus }
```

```java
// Validasi transisi status di OrderService:
private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
    "Pending",    List.of("Processing", "Cancelled"),
    "Processing", List.of("Shipped", "Cancelled"),
    "Shipped",    List.of("Completed"),
    "Completed",  List.of(),
    "Cancelled",  List.of()
);

public void updateOrderStatus(Integer orderId, String newStatus) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));
    List<String> allowed = VALID_TRANSITIONS.getOrDefault(order.getStatus(), List.of());
    if (!allowed.contains(newStatus)) {
        throw new CustomBusinessException("OTK-4095",
            "Status tidak bisa diubah dari '" + order.getStatus() + "' ke '" + newStatus + "'", 400);
    }
    order.setStatus(newStatus);
    orderRepository.save(order);
}
```

---

### 9.4 Admin Flow: Manajemen User

#### Endpoint yang Perlu Dibuat

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | Lihat semua user | ✅ ADMIN |
| `GET` | `/api/v1/admin/users/{id}` | Detail satu user | ✅ ADMIN |
| `PATCH` | `/api/v1/admin/users/{id}/role` | Ubah role user | ✅ ADMIN |
| `POST` | `/api/v1/admin/users/{id}/force-logout` | Force logout user | ✅ ADMIN |
| `DELETE` | `/api/v1/admin/users/{id}` | Nonaktifkan akun user | ✅ ADMIN |

#### Flow Force Logout User (Saat Token Dicuri / Abuse)

```
Admin ──POST /admin/users/42/force-logout──> AdminUserController
                                                   │
                                                   ├──> AuthService.forceLogoutUser(42)
                                                   │         │
                                                   │    ┌────┴────────────────────────────────┐
                                                   │    │ 1. Redis: SET user_force_logout:42   │
                                                   │    │           TTL = 24 jam              │
                                                   │    │ 2. DB: UPDATE RefreshTokens         │
                                                   │    │        SET Revoked = 1              │
                                                   │    │        WHERE UserID = 42            │
                                                   │    └─────────────────────────────────────┘
                                                  HTTP 200 "User 42 berhasil di-force-logout"

← Semua token lama user 42 otomatis ditolak di JwtAuthFilter
  (Redis menyimpan timestamp force-logout, token lama yang diterbitkan
   sebelum timestamp tersebut akan selalu ditolak)
```

---

### 9.5 Admin Flow: Manajemen Diskon

#### Endpoint yang Perlu Dibuat

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/v1/discounts` | Lihat semua kode diskon | Public |
| `POST` | `/api/v1/discounts` | Buat kode diskon baru | ✅ ADMIN |
| `PUT` | `/api/v1/discounts/{id}` | Update kode diskon | ✅ ADMIN |
| `DELETE` | `/api/v1/discounts/{id}` | Nonaktifkan kode diskon | ✅ ADMIN |
| `GET` | `/api/v1/discounts/validate?code=KODE` | Validasi kode sebelum checkout | ✅ CUSTOMER |

#### Validasi Bisnis Diskon (Field Tambahan di Entitas `Discount`)

```java
// Field baru yang perlu ditambahkan ke Discount.java:
@Column(name = "MaxUsage")
private Integer maxUsage;        // Batas maks total pemakaian (null = unlimited)

@Column(name = "UsageCount")
private Integer usageCount = 0;  // Sudah dipakai berapa kali

@Column(name = "ExpiryDate")
private LocalDateTime expiryDate; // Batas berlaku (null = tidak ada batas)

@Column(name = "IsActive")
private Boolean isActive = true;  // Bisa dinonaktifkan tanpa dihapus

// Di DiscountService — validasi sebelum diterapkan ke order:
public Discount validateAndApply(String code) {
    Discount d = discountRepository.findByCode(code)
        .orElseThrow(() -> new CustomBusinessException("OTK-4043", "Kode diskon tidak valid", 400));
    if (!d.getIsActive())
        throw new CustomBusinessException("OTK-4096", "Kode diskon sudah tidak aktif", 400);
    if (d.getExpiryDate() != null && LocalDateTime.now().isAfter(d.getExpiryDate()))
        throw new CustomBusinessException("OTK-4097", "Kode diskon sudah kadaluarsa", 400);
    if (d.getMaxUsage() != null && d.getUsageCount() >= d.getMaxUsage())
        throw new CustomBusinessException("OTK-4098", "Kuota kode diskon sudah habis", 400);
    d.setUsageCount(d.getUsageCount() + 1);
    discountRepository.save(d);
    return d;
}
```

---

### 9.6 Admin Flow: Penetapan Harga Custom Order

Karena harga tidak boleh dari client (lihat [6.3](#63-celah-di-customorderservicejava--harga-ditentukan-client)), Admin harus menetapkan harga via workflow berikut:

```
CUSTOMER                      SISTEM                        ADMIN
    │                            │                             │
    │  POST /custom-orders       │                             │
    │  { serviceType,            │                             │
    │    imageUrl, configJson }  │                             │
    │  (TANPA field price!)      │                             │
    │───────────────────────────>│                             │
    │                            │  Status: "Pending Review"   │
    │                            │  Price: NULL                │
    │  HTTP 201: { customOrderId,│─────────────────────────────>
    │    status: "Pending" }     │                             │
    │<───────────────────────────│                 Admin meninjau spec  
    │                            │                             │
    │                            │<─── PATCH /admin/custom-orders/{id}/price
    │                            │     Body: { "price": 750000 }
    │                            │                             │
    │                            │  Status: "Quoted"           │
    │                            │  Price: 750000              │
    │                            │                             │
    │  POST /orders              │                             │
    │  { customOrderId: X }      │                             │
    │  (Customer setuju, checkout)                             │
    │───────────────────────────>│                             │
    │                            │  Status: "Ordered"          │
```

#### Endpoint Tambahan

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/v1/admin/custom-orders` | Lihat semua custom order masuk | ✅ ADMIN |
| `PATCH` | `/api/v1/admin/custom-orders/{id}/price` | Tetapkan harga (oleh Admin) | ✅ ADMIN |
| `PATCH` | `/api/v1/admin/custom-orders/{id}/status` | Update status custom order | ✅ ADMIN |
| `GET` | `/api/v1/custom-orders` | Lihat custom order milik sendiri | ✅ CUSTOMER |

---

### 9.7 Ringkasan: Semua Endpoint Admin yang Perlu Dibuat

| # | Endpoint | Method | Prioritas | File Baru / Dimodifikasi |
|---|---|---|---|---|
| 1 | `/api/v1/products/{id}` | `GET` | 🟡 P3 | `ProductController`, `ProductService` |
| 2 | `/api/v1/products` | `POST` `PUT` `DELETE` `PATCH` | 🟠 P2 | `ProductController`, `ProductService`, [NEW] `ProductRequestDTO` |
| 3 | `/api/v1/admin/orders` | `GET` | 🟡 P3 | [NEW] `AdminOrderController`, `OrderService` |
| 4 | `/api/v1/admin/orders/{id}/status` | `PATCH` | 🟡 P3 | `AdminOrderController`, `OrderService.updateStatus()` |
| 5 | `/api/v1/orders` | `GET` | 🟡 P3 | `OrderController`, `OrderService.getOrdersByUser()` |
| 6 | `/api/v1/orders/{id}` | `GET` | 🟡 P3 | `OrderController` + ownership check |
| 7 | `/api/v1/admin/users` | `GET` `PATCH` `DELETE` | 🟡 P3 | [NEW] `AdminUserController`, [NEW] `UserService` |
| 8 | `/api/v1/admin/users/{id}/force-logout` | `POST` | 🟠 P2 | `AdminUserController`, `AuthService.forceLogoutUser()` |
| 9 | `/api/v1/discounts` | `POST` `PUT` `DELETE` | 🟡 P3 | `DiscountController`, `DiscountService` |
| 10 | `/api/v1/discounts/validate` | `GET` | 🟡 P3 | `DiscountController`, `DiscountService.validateAndApply()` |
| 11 | `/api/v1/admin/custom-orders` | `GET` | 🟡 P3 | [NEW] `AdminCustomOrderController` |
| 12 | `/api/v1/admin/custom-orders/{id}/price` | `PATCH` | 🔴 P1 | `AdminCustomOrderController`, `CustomOrderService` |
| 13 | `/api/v1/custom-orders` | `GET` | 🟡 P3 | `CustomOrderController` + ownership check |

---

## 10. 🧩 Temuan Tambahan — Gap Yang Belum Terdokumentasi Sebelumnya

Setelah analisa ulang menyeluruh terhadap *seluruh* file source code backend, ditemukan 5 celah tambahan yang belum tercakup dalam bagian-bagian sebelumnya:

---

### 10.1 `DiscountController.java` — Entitas JPA Bocor Langsung ke Response

```java
// DiscountController.java — Line 17:
public ResponseEntity<Discount> validateDiscount(@PathVariable String code) {
    return discountService.validateDiscountCode(code)
            .map(ResponseEntity::ok)    // ← Return entitas Discount mentah!
            .orElse(ResponseEntity.notFound().build());
}
```

**Masalah**: Sama persis dengan `CustomOrderController` — mengembalikan entitas JPA `Discount` langsung ke response. Risiko:
- Eksposur seluruh struktur kolom database ke publik (termasuk `DiscountID`, `ApplicableCategory`, dll).
- `DiscountController` pun **tidak** memerlukan autentikasi sama sekali (endpoint publik), artinya siapapun bisa melihat detail internal kode diskon hanya dengan tahu kodenya.

**Solusi**: Buat `DiscountResponseDTO.java` yang hanya mengekspos: `code`, `discountType`, `discountValue`, `applicableCategory`. Hapus ID dan field internal dari response.

---

### 10.2 `ImageUploadController.java` — Upload Gambar Tanpa Validasi & Penyimpanan Nyata

```java
// ImageUploadController.java — Line 24-26:
// Stub logic: intercept and return mock URL
String mockGeneratedUrl = "https://ecommerce.otaku.local/images/custom/" + file.getOriginalFilename();
return ResponseEntity.ok("File received... URL: " + mockGeneratedUrl);
```

**Masalah Kritis (Multi-Layer)**:

| Celah | Dampak |
|---|---|
| **Stub implementation** — tidak ada penyimpanan nyata | File dikirim client tapi tidak tersimpan ke mana-mana |
| **Tidak ada validasi tipe file** | Client bisa upload `.php`, `.exe`, `.sh` — potensi Remote Code Execution jika server salah konfigurasi. Format yang **hanya diizinkan**: `png`, `jpg`, `jpeg` |
| **Tidak ada validasi ukuran file** | Client bisa upload file melebihi batas → DoS via storage exhaustion. Batas maksimal: **5 MB** |
| **Path traversal** via `getOriginalFilename()` | Nama file seperti `../../config/application.yml` bisa memanipulasi path jika diproses sebagai path |
| **Tidak ada autentikasi** | Endpoint `/api/v1/upload/custom-figure` tidak tercakup dalam `SecurityConfig.java` → aksesibel publik |

**Solusi**:
```java
// Validasi yang harus ditambahkan di ImageUploadController.java:

// ✅ Hanya izinkan format gambar standar: PNG, JPG, JPEG
private static final List<String> ALLOWED_MIME_TYPES = List.of(
    "image/png",    // .png
    "image/jpeg"    // .jpg dan .jpeg (keduanya menggunakan MIME type yang sama)
);

// ✅ Batas maksimum ukuran file: 5 MB
private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5,242,880 bytes

// Pengecekan tipe MIME:
if (file.getContentType() == null || !ALLOWED_MIME_TYPES.contains(file.getContentType())) {
    return ResponseEntity.badRequest().body(
        "Format file tidak didukung. Hanya PNG, JPG, dan JPEG yang diizinkan."
    );
}

// Pengecekan ukuran file:
if (file.getSize() > MAX_FILE_SIZE_BYTES) {
    return ResponseEntity.badRequest().body(
        "Ukuran file melebihi batas maksimal 5MB."
    );
}

// ✅ Simpan dengan nama aman (JANGAN pakai nama file asli dari client):
String extension = file.getContentType().equals("image/png") ? ".png" : ".jpg";
String safeFileName = UUID.randomUUID() + "_" + System.currentTimeMillis() + extension;
```

---

### 10.3 `DataCleanupScheduler.java` — Scheduler Hanya Stub, Tidak Ada Implementasi Nyata

```java
// DataCleanupScheduler.java:
@Scheduled(cron = "0 0 0 * * ?")
public void cleanupOldPendingOrders() {
    logger.info("Scheduler Triggered...");
    // Stub implementation for executing deletes
}

@Scheduled(cron = "0 0 1 * * ?")
public void expireOldDiscountCodes() {
    logger.info("Scheduler Triggered...");
    // Stub implementation for marking coupons as inactive
}
```

**Masalah**: Dua scheduled task sudah terkonfigurasi (cron aktif, akan berjalan di production), namun **tidak ada implementasi nyata** di dalamnya. Akibatnya:
1. `cleanupOldPendingOrders`: Order Pending lama **tidak akan pernah dibersihkan** → database penuh dengan data sampah.
2. `expireOldDiscountCodes`: Kode diskon yang harusnya expired **tetap berlaku selamanya** → kerugian bisnis.

**Solusi**: Implementasikan query aktual di kedua metode:
```java
// cleanupOldPendingOrders:
LocalDateTime cutoff = LocalDateTime.now().minusDays(3);
List<Order> staleOrders = orderRepository
    .findByStatusAndCreatedAtBefore("Pending", cutoff);
orderRepository.deleteAll(staleOrders);
logger.info("Deleted {} stale pending orders", staleOrders.size());

// expireOldDiscountCodes:
// (Butuh field ExpiryDate di Discount — lihat Bagian 9.5)
discountRepository.deactivateExpiredDiscounts(LocalDateTime.now());
```

---

### 10.4 `CustomOrderRequestDTO.java` — Double IDOR: userId DAN price Dari Client

```java
// CustomOrderRequestDTO.java:
private Integer userId;              // ← IDOR #1: user bisa impersonate user lain
private java.math.BigDecimal price;  // ← IDOR #2: user tetapkan harga sendiri
```

**Masalah**: `CustomOrderRequestDTO` memiliki **dua** field yang seharusnya tidak bisa dikontrol client:
1. `userId` — tidak boleh dari body request (sama seperti `OrderRequestDTO`, harus dari JWT).
2. `price` — tidak boleh dari client, harus ditetapkan Admin setelah review (lihat [9.6](#96-admin-flow-penetapan-harga-custom-order)).

**Solusi Lengkap DTO yang Benar:**
```java
// CustomOrderRequestDTO.java — setelah perbaikan:
public class CustomOrderRequestDTO {
    // ✅ Hanya ini yang boleh dari client:
    @NotBlank private String serviceType;   // Validasi enum: AF_3D / Outfit
    private String imageReferenceUrl;        // URL gambar yang sudah di-upload
    private String configurationJson;        // Konfigurasi detail

    // ❌ HAPUS:
    // private Integer userId;   → ambil dari Authentication JWT
    // private BigDecimal price; → ditetapkan Admin via PATCH /admin/custom-orders/{id}/price
}
```

---

### 10.5 `CustomOrder.java` — Tidak Ada Field `Status` di Entitas

```java
// CustomOrder.java — seluruh field yang ada:
private Integer id;
private User user;
private String serviceType;
private String imageReferenceUrl;
private String configurationJson;
private BigDecimal price;       // ← Harga dari client (masalah)
private LocalDateTime createdAt;
// ❌ Tidak ada: private String status;
```

**Masalah**: Entitas `CustomOrder` tidak memiliki field `status`. Padahal berdasarkan workflow di [9.6](#96-admin-flow-penetapan-harga-custom-order), workflow custom order membutuhkan transisi status:

```
"Pending Review" → "Quoted" → "Ordered" → "In Production" → "Completed"
```

Tanpa field `status`, tidak ada cara untuk membedakan custom order yang baru masuk, yang sudah diquote Admin, maupun yang sudah di-checkout customer.

**Solusi**: Tambahkan field status ke entitas dan migrasi database:
```java
// Tambahkan ke CustomOrder.java:
@Column(name = "Status", length = 50)
private String status = "Pending Review";  // Default saat pertama dibuat
```

Dan tambahkan kolom di SQL Server via Flyway migration:
```sql
-- V3__add_custom_order_status.sql
ALTER TABLE CustomOrders ADD Status NVARCHAR(50) NOT NULL DEFAULT 'Pending Review';
```

---

### 10.6 Ringkasan Hasil Analisa Ulang — Status Kelengkapan Dokumen

| Bagian | Cakupan | Status |
|---|---|---|
| Arsitektur & Teknologi | Perbandingan dependency blueprint vs aktual | ✅ Lengkap |
| Struktur Database & Entitas | Gap tabel RefreshTokens, lazy loading | ✅ Lengkap |
| Regulasi Autentikasi JWT | Dual token, hashing, hardcoded secret | ✅ Lengkap |
| OWASP Top 10 (2021) | Semua A01–A10 dianalisa terhadap kode aktual | ✅ Lengkap |
| Roadmap Implementasi | Tahap 1–6 sinkronisasi blueprint | ✅ Lengkap |
| Temuan Source Code Mendalam | IDOR, entitas bocor, harga dari client, stok | ✅ Lengkap |
| Flow & Logic Bisnis | Partial commit, double query, endpoint hilang | ✅ Lengkap |
| Matriks Prioritas | P1–P4 untuk semua temuan | ✅ Lengkap |
| Admin Flow | CRUD produk, order, user, diskon, custom order | ✅ Lengkap |
| **DiscountController bocor entitas** | Return `Discount` JPA mentah ke response publik | ✅ **Baru ditambahkan** |
| **ImageUploadController tidak aman** | Stub, tidak ada validasi tipe/ukuran, no auth | ✅ **Baru ditambahkan** |
| **DataCleanupScheduler stub** | Scheduler aktif berjalan tapi tanpa implementasi | ✅ **Baru ditambahkan** |
| **Double IDOR di CustomOrderRequestDTO** | userId + price keduanya dari client | ✅ **Baru ditambahkan** |
| **Status CustomOrder tidak ada di entitas** | Tidak bisa tracking workflow approval | ✅ **Baru ditambahkan** |

---

## 11. 🌐 3rd Party API Upload Gambar — Cloudinary (Free Plan)

Kedua endpoint upload menggunakan **satu akun Cloudinary Free Plan** dengan pembagian folder terpisah. Tidak ada ImgBB atau layanan lain.

> [!NOTE]
> **Cloudinary Free Plan** mencakup: **25 GB storage** + **25 GB bandwidth/bulan** + **25 Kredit transformasi/bulan** — lebih dari cukup untuk tahap development hingga small-scale production.

---

### 11.1 Gambaran Kebutuhan Upload Per Tipe Order

| Aspek | Custom Outfit Order | Custom 3D Action Figure Order |
|---|---|---|
| **Jenis file** | Referensi desain pakaian (PNG, JPG, JPEG) | Referensi pose/karakter (PNG, JPG, JPEG) |
| **Ukuran file** | Maks **5 MB** | Maks **5 MB** |
| **Folder Cloudinary** | `otaku-ecommerce/outfit-references/` | `otaku-ecommerce/figure-references/` |
| **Resize otomatis** | Thumbnail 400×400 px (preview) | 800×800 px (detail review Admin) |
| **Endpoint** | `POST /api/v1/upload/outfit-reference` | `POST /api/v1/upload/figure-reference` |
| **Autentikasi** | Wajib: `CUSTOMER` atau `ADMIN` | Wajib: `CUSTOMER` atau `ADMIN` |
| **Rate Limit** | Maks **5 upload / 10 menit** per IP | Maks **5 upload / 10 menit** per IP |

---

### 11.2 Cloudinary Free Plan — Batas & Kuota

| Fitur | Free Plan |
|---|---|
| **Storage** | 25 GB (total semua file) |
| **Bandwidth** | 25 GB / bulan |
| **Transformasi** | 25 Kredit / bulan (1 transformasi = 1 kredit) |
| **Jumlah file** | Tidak dibatasi |
| **Max upload size** | 10 MB per file (kita batasi 5 MB di backend) |
| **Format didukung** | PNG, JPG, JPEG, dan lainnya |
| **CDN** | ✅ Global CDN via `res.cloudinary.com` |
| **URL HTTPS** | ✅ `secure_url` selalu HTTPS |
| **SLA** | ✅ 99.9% uptime |
| **Harga** | ✅ **Gratis selamanya** (no credit card required) |

> [!IMPORTANT]
> Pantau usage di [console.cloudinary.com](https://console.cloudinary.com) secara berkala. Jika storage mendekati 25 GB, arsipkan atau hapus file referensi yang sudah tidak dipakai via dashboard Cloudinary.

---

### 11.3 Dependency & Konfigurasi

#### `pom.xml`

```xml
<!-- Cloudinary Java SDK — satu dependency untuk kedua endpoint upload -->
<dependency>
    <groupId>com.cloudinary</groupId>
    <artifactId>cloudinary-http44</artifactId>
    <version>1.38.0</version>
</dependency>
```

#### `application.yml`

```yaml
# Cloudinary Free Plan — semua kredensial dari ENV, JANGAN hardcode
cloudinary:
  cloud-name:     ${CLOUDINARY_CLOUD_NAME}    # Dari dashboard.cloudinary.com → Settings → Account
  api-key:        ${CLOUDINARY_API_KEY}        # Dari dashboard.cloudinary.com → API Keys
  api-secret:     ${CLOUDINARY_API_SECRET}     # Dari dashboard.cloudinary.com → API Keys
  outfit-folder:  otaku-ecommerce/outfit-references   # Folder upload outfit
  figure-folder:  otaku-ecommerce/figure-references   # Folder upload figure

# Upload rate limit (via bucket4j — lihat bagian 11.6)
upload:
  rate-limit:
    capacity: 5           # Maks 5 upload per window
    refill-minutes: 10    # Window waktu: 10 menit per IP
```

#### `CloudinaryConfig.java` — Bean Terpusat (Satu Bean untuk Dua Service)

```java
@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name}") private String cloudName;
    @Value("${cloudinary.api-key}")    private String apiKey;
    @Value("${cloudinary.api-secret}") private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key",    apiKey,
            "api_secret", apiSecret,
            "secure",     true   // Paksa HTTPS untuk semua URL yang dihasilkan
        ));
    }
}
```

---

### 11.4 Service Layer Upload

#### `CloudinaryUploadService.java` — Service Terpusat (Dipakai Kedua Endpoint)

```java
@Service
public class CloudinaryUploadService {

    @Autowired
    private Cloudinary cloudinary;

    @Value("${cloudinary.outfit-folder}") private String outfitFolder;
    @Value("${cloudinary.figure-folder}") private String figureFolder;

    // ─── Format & Ukuran yang diizinkan ───────────────────────────────
    private static final List<String> ALLOWED_MIME  = List.of("image/png", "image/jpeg");
    private static final long         MAX_BYTES      = 5L * 1024 * 1024; // 5 MB tepat

    // ─── Upload Outfit Reference ──────────────────────────────────────
    public String uploadOutfitReference(MultipartFile file) throws IOException {
        validateFile(file);
        return doUpload(file, outfitFolder, "outfit_", 400, 400, "fill");
    }

    // ─── Upload Figure Reference ──────────────────────────────────────
    public String uploadFigureReference(MultipartFile file) throws IOException {
        validateFile(file);
        return doUpload(file, figureFolder, "figure_", 800, 800, "fit");
    }

    // ─── Implementasi Upload ke Cloudinary ────────────────────────────
    private String doUpload(MultipartFile file, String folder, String prefix,
                            int width, int height, String cropMode) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder",             folder,
                "resource_type",      "image",
                "allowed_formats",    new String[]{"png", "jpg", "jpeg"},
                "public_id",          prefix + UUID.randomUUID(),   // Nama aman via UUID
                "overwrite",          false,       // Cegah overwrite file yang sudah ada
                "invalidate",         true,        // Invalidasi CDN cache jika ada nama bentrok
                "strip_metadata",     true,        // Hapus metadata EXIF (GPS, kamera, dll)
                "eager", ObjectUtils.asMap(        // Auto-resize untuk preview
                    "width", width, "height", height, "crop", cropMode
                )
            )
        );
        return (String) result.get("secure_url"); // Selalu return HTTPS URL
    }

    // ─── Validasi File (Lapisan Pertama — sebelum kirim ke Cloudinary) ─
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new CustomBusinessException("OTK-4101", "File tidak boleh kosong.", 400);

        if (file.getContentType() == null || !ALLOWED_MIME.contains(file.getContentType()))
            throw new CustomBusinessException("OTK-4099",
                "Format tidak didukung. Hanya PNG, JPG, dan JPEG yang diizinkan.", 400);

        if (file.getSize() > MAX_BYTES)
            throw new CustomBusinessException("OTK-4100",
                "Ukuran file melebihi batas maksimal 5 MB.", 400);
    }
}
```

---

### 11.5 Controller Layer Upload

#### `ImageUploadController.java` — Refactored (Ganti Stub Lama)

```java
@RestController
@RequestMapping("/api/v1/upload")
public class ImageUploadController {

    @Autowired
    private CloudinaryUploadService uploadService;

    /** Endpoint #1 — Referensi gambar Custom Outfit Order */
    @PostMapping("/outfit-reference")
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadOutfitReference(
            @RequestParam("file") MultipartFile file) throws IOException {

        String imageUrl = uploadService.uploadOutfitReference(file);
        return ResponseEntity.ok(ApiResponse.success(
            "OTK-2031",
            "Gambar referensi outfit berhasil diupload",
            Map.of("imageUrl", imageUrl)
        ));
    }

    /** Endpoint #2 — Referensi gambar Custom 3D Action Figure Order */
    @PostMapping("/figure-reference")
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFigureReference(
            @RequestParam("file") MultipartFile file) throws IOException {

        String imageUrl = uploadService.uploadFigureReference(file);
        return ResponseEntity.ok(ApiResponse.success(
            "OTK-2032",
            "Gambar referensi action figure berhasil diupload",
            Map.of("imageUrl", imageUrl)
        ));
    }
}
```

---

### 11.6 Rate Limit untuk Endpoint Upload

Endpoint upload perlu proteksi rate limit terpisah dari endpoint login. Tambahkan logika berikut ke `RateLimitFilter.java`:

```java
// RateLimitFilter.java — Tambahkan bucket untuk /upload/**
// Batas: 5 upload per 10 menit per IP

private final Map<String, Bucket> loginCache  = new ConcurrentHashMap<>();
private final Map<String, Bucket> uploadCache = new ConcurrentHashMap<>();

private Bucket createLoginBucket() {
    // Existing: 5 request / 1 menit
    return Bucket.builder()
        .addLimit(Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))))
        .build();
}

private Bucket createUploadBucket() {
    // NEW: 5 upload / 10 menit per IP (lebih longgar, upload lebih lambat)
    return Bucket.builder()
        .addLimit(Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(10))))
        .build();
}

@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain)
        throws ServletException, IOException {

    String uri      = request.getRequestURI();
    String clientIp = resolveClientIp(request);

    // ─── Rate limit Login ───────────────────────────────────
    if (uri.startsWith("/api/v1/auth/login") ||
        uri.startsWith("/api/v1/auth/register")) {
        Bucket bucket = loginCache.computeIfAbsent(clientIp, k -> createLoginBucket());
        if (!bucket.tryConsume(1)) {
            writeRateLimitResponse(response,
                "Terlalu banyak percobaan. Coba lagi dalam 1 menit.");
            return;
        }
    }

    // ─── Rate limit Upload ──────────────────────────────────
    if (uri.startsWith("/api/v1/upload/")) {
        Bucket bucket = uploadCache.computeIfAbsent(clientIp, k -> createUploadBucket());
        if (!bucket.tryConsume(1)) {
            writeRateLimitResponse(response,
                "Batas upload tercapai (5 file per 10 menit). Coba lagi nanti.");
            return;
        }
    }

    filterChain.doFilter(request, response);
}

private String resolveClientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    return (forwarded != null && !forwarded.isEmpty())
        ? forwarded.split(",")[0].trim()
        : request.getRemoteAddr();
}

private void writeRateLimitResponse(HttpServletResponse response, String message)
        throws IOException {
    response.setStatus(429);
    response.setContentType("application/json;charset=UTF-8");
    response.getWriter().write(
        "{\"success\":false,\"internalCode\":\"OTK-4290\",\"message\":\"" + message + "\"}"
    );
}
```

> [!TIP]
> **Solusi memory leak bucket**: Gunakan `Caffeine Cache` dengan TTL 15 menit sebagai pengganti `ConcurrentHashMap` agar entry IP lama otomatis dihapus:
> ```java
> private final Cache<String, Bucket> uploadCache = Caffeine.newBuilder()
>     .expireAfterAccess(15, TimeUnit.MINUTES)
>     .build();
> // Ganti: uploadCache.computeIfAbsent(...)
> // Dengan: uploadCache.get(clientIp, k -> createUploadBucket())
> ```

---

### 11.7 Lapisan Keamanan Upload (Multi-Layer Defense)

```
┌───────────────────────────────────────────────────────────────┐
│             LAPISAN PERTAHANAN UPLOAD GAMBAR                   │
│                                                                │
│  REQUEST                                                       │
│     │                                                          │
│     ▼                                                          │
│  [Layer 1] RateLimitFilter                                     │
│     → Maks 5 upload / 10 menit per IP                         │
│     → HTTP 429 jika melebihi batas                            │
│     │                                                          │
│     ▼                                                          │
│  [Layer 2] JwtAuthenticationFilter                             │
│     → Token JWT valid? Jika tidak → HTTP 401                  │
│     → @PreAuthorize: hanya Customer / Admin                   │
│     │                                                          │
│     ▼                                                          │
│  [Layer 3] CloudinaryUploadService.validateFile()              │
│     → File tidak kosong?                                       │
│     → MIME type: image/png atau image/jpeg?                    │
│     → Ukuran: ≤ 5 MB (5,242,880 bytes)?                       │
│     → Jika gagal → HTTP 400 + pesan spesifik                  │
│     │                                                          │
│     ▼                                                          │
│  [Layer 4] Cloudinary API (Validasi Kedua)                     │
│     → allowed_formats: ["png","jpg","jpeg"]                    │
│     → strip_metadata: true (hapus GPS/EXIF)                   │
│     → public_id: UUID (nama file tidak dari client)           │
│     → eager: resize otomatis sesuai tipe                      │
│     │                                                          │
│     ▼                                                          │
│  [Response] secure_url HTTPS dikembalikan ke client           │
│     → URL disimpan di CustomOrders.ImageReferenceURL           │
└───────────────────────────────────────────────────────────────┘
```

#### Tabel Aturan Keamanan Upload

| # | Aturan | Implementasi | File |
|---|---|---|---|
| 1 | **Rate limit upload** | Maks 5/10 menit per IP via bucket4j | `RateLimitFilter.java` |
| 2 | **Autentikasi wajib** | `@PreAuthorize("hasAnyRole('Customer','Admin')")` | `ImageUploadController.java` |
| 3 | **Validasi MIME type** | `List.of("image/png","image/jpeg")` di Service | `CloudinaryUploadService.java` |
| 4 | **Validasi ukuran** | `file.getSize() > 5L * 1024 * 1024` → reject | `CloudinaryUploadService.java` |
| 5 | **Nama file UUID** | `"outfit_" + UUID.randomUUID()` — bukan nama asli | `CloudinaryUploadService.java` |
| 6 | **Strip EXIF** | `"strip_metadata", true` di Cloudinary options | `CloudinaryUploadService.java` |
| 7 | **Selalu HTTPS** | `"secure", true` di config + return `secure_url` | `CloudinaryConfig.java` |
| 8 | **Kredensial via ENV** | `@Value("${cloudinary.api-secret}")` — tidak hardcode | `CloudinaryConfig.java` |
| 9 | **No overwrite** | `"overwrite", false` — cegah tumpang tindih file | `CloudinaryUploadService.java` |

> [!CAUTION]
> **Jangan pernah menyimpan `CLOUDINARY_API_SECRET` di source code atau `application.yml` langsung!**
> Selalu gunakan environment variable. Di production (server), set via `export CLOUDINARY_API_SECRET=xxx` atau via `.env` file yang tidak di-commit ke Git (tambahkan ke `.gitignore`).


---

### 11.1 Gambaran Kebutuhan Upload Per Tipe Order

| Aspek | Custom Outfit Order | Custom 3D Action Figure Order |
|---|---|---|
| **Jenis file** | Gambar referensi desain (PNG, JPG, JPEG) | Gambar referensi karakter/pose (PNG, JPG, JPEG) |
| **Ukuran file** | Maks 5 MB | Maks 5 MB |
| **Kebutuhan transformasi** | ✅ Resize/thumbnail untuk preview | ✅ Optimasi kualitas untuk review Admin |
| **Kebutuhan CDN** | ✅ Diakses Admin & Customer via URL | ✅ Diakses Admin untuk proses 3D modelling |
| **Endpoint saat ini** | ❌ Belum ada endpoints terpisah | `/api/v1/upload/custom-figure` (stub) |
| **Endpoint yang dibutuhkan** | `/api/v1/upload/outfit-reference` | `/api/v1/upload/figure-reference` |

---

### 11.2 API #1 — Upload Custom Outfit Order: **Cloudinary** ⭐ Rekomendasi Utama

**Cloudinary** adalah platform manajemen aset media berbasis cloud yang sangat populer di dunia e-commerce, dirancang khusus untuk pengelolaan gambar dan video secara profesional.

#### Keunggulan Cloudinary untuk Custom Outfit

| Fitur | Detail |
|---|---|
| **Free Tier** | 25 GB storage + 25 GB bandwidth/bulan (cukup untuk development & small-scale production) |
| **Java SDK** | Tersedia official SDK (`cloudinary-http44`) — integrasi mudah dengan Spring Boot |
| **Auto Transformation** | Resize otomatis, crop, thumbnail, watermark via URL parameter |
| **Secure Upload** | Upload menggunakan `signed_upload` — mencegah client upload langsung tanpa token |
| **URL Permanen** | File tersimpan di CDN global Cloudinary, URL tidak berubah |
| **Format Validation** | Validasi format di sisi Cloudinary (lapisan kedua selain validasi Spring) |

#### Dependency `pom.xml`

```xml
<!-- Cloudinary Java SDK -->
<dependency>
    <groupId>com.cloudinary</groupId>
    <artifactId>cloudinary-http44</artifactId>
    <version>1.38.0</version>
</dependency>
```

#### Konfigurasi `application.yml`

```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}   # Dari ENV → dashboard.cloudinary.com
  api-key:    ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
  outfit-folder: otaku-ecommerce/outfit-references  # Folder khusus outfit
```

#### Kode Integrasi Spring Boot — `CloudinaryOutfitUploadService.java`

```java
@Service
public class CloudinaryOutfitUploadService {

    @Value("${cloudinary.cloud-name}")  private String cloudName;
    @Value("${cloudinary.api-key}")     private String apiKey;
    @Value("${cloudinary.api-secret}")  private String apiSecret;
    @Value("${cloudinary.outfit-folder}") private String folder;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key",    apiKey,
            "api_secret", apiSecret,
            "secure",     true         // Selalu gunakan HTTPS
        ));
    }

    public String uploadOutfitReference(MultipartFile file) throws IOException {
        // Validasi format & ukuran (lapisan pertama — di Spring)
        validateImageFile(file);

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
            file.getBytes(),
            ObjectUtils.asMap(
                "folder",          folder,
                "resource_type",   "image",
                "allowed_formats", new String[]{"png", "jpg", "jpeg"},
                // Auto-resize: simpan 2 versi — original & thumbnail 400px
                "eager", ObjectUtils.asMap(
                    "width", 400, "height", 400, "crop", "fill"
                ),
                // Nama file aman — pakai UUID bukan nama asli dari client
                "public_id", "outfit_" + UUID.randomUUID()
            )
        );

        return (String) uploadResult.get("secure_url"); // URL HTTPS permanen
    }

    private void validateImageFile(MultipartFile file) {
        List<String> allowed = List.of("image/png", "image/jpeg");
        if (!allowed.contains(file.getContentType()))
            throw new CustomBusinessException("OTK-4099",
                "Format tidak didukung. Hanya PNG, JPG, JPEG.", 400);
        if (file.getSize() > 5L * 1024 * 1024)
            throw new CustomBusinessException("OTK-4100",
                "Ukuran file melebihi batas 5MB.", 400);
    }
}
```

#### Endpoint Controller — `/api/v1/upload/outfit-reference`

```java
@PostMapping("/outfit-reference")
@PreAuthorize("hasAnyRole('Customer', 'Admin')")
public ResponseEntity<ApiResponse<Map<String, String>>> uploadOutfitReference(
        @RequestParam("file") MultipartFile file) throws IOException {
    String imageUrl = cloudinaryOutfitService.uploadOutfitReference(file);
    return ResponseEntity.ok(ApiResponse.success(
        "OTK-2031", "Gambar referensi outfit berhasil diupload",
        Map.of("imageUrl", imageUrl)
    ));
}
```

---

### 11.3 API #2 — Upload Custom 3D Action Figure: **Cloudinary** (Folder Terpisah) atau **ImgBB** (Alternatif Gratis)

Untuk referensi gambar 3D Action Figure, ada dua opsi rekomendasi tergantung kebutuhan:

#### Opsi A: Cloudinary (Folder Terpisah) — ⭐ Rekomendasi Jika Budget Fleksibel

Menggunakan akun Cloudinary yang **sama** dengan outfit, namun folder dan konfigurasi yang berbeda. Keuntungan: satu akun, satu SDK, satu konfigurasi ENV.

```yaml
# Tambahan di application.yml:
cloudinary:
  figure-folder: otaku-ecommerce/figure-references  # Folder terpisah dari outfit
```

```java
// CloudinaryFigureUploadService.java — hampir identik, perbedaan hanya folder & public_id prefix:
"folder",     figureFolderConfig,
"public_id",  "figure_" + UUID.randomUUID(),
// Untuk 3D reference, simpan resolusi lebih tinggi (800px):
"eager", ObjectUtils.asMap("width", 800, "height", 800, "crop", "fit")
```

#### Opsi B: ImgBB — ⭐ Rekomendasi Jika Ingin Gratis Sepenuhnya

**ImgBB** adalah layanan hosting gambar gratis dengan API sederhana dan tidak memerlukan SDK khusus (cukup HTTP POST).

| Fitur | ImgBB |
|---|---|
| **Harga** | ✅ Gratis sepenuhnya (dengan iklan di halaman web mereka, bukan di API) |
| **API** | REST API sederhana — cukup `POST` dengan `multipart/form-data` |
| **Ukuran Maks** | 32 MB per gambar |
| **Penyimpanan** | Tidak ada batas storage di free tier |
| **URL** | URL permanen, aksesibel publik via CDN |
| **Kekurangan** | Tidak ada transformasi otomatis, privasi terbatas (gambar publik), SLA tidak dijamin |

**Kapan pilih ImgBB?** → Development/Demo, atau jika gambar figur tidak bersifat sensitif/privat.

```xml
<!-- Tidak perlu dependency tambahan — gunakan Spring RestTemplate/WebClient -->
```

```yaml
# application.yml:
imgbb:
  api-key: ${IMGBB_API_KEY}   # Daftar gratis di api.imgbb.com
  api-url: https://api.imgbb.com/1/upload
```

```java
@Service
public class ImgBBFigureUploadService {

    @Value("${imgbb.api-key}")  private String apiKey;
    @Value("${imgbb.api-url}")  private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadFigureReference(MultipartFile file) throws IOException {
        // Validasi lokal terlebih dahulu
        validateImageFile(file);

        // Encode gambar ke Base64 (yang diminta ImgBB API)
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());

        // Bangun form request
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("key",   apiKey);
        body.add("image", base64Image);
        body.add("name",  "figure_" + UUID.randomUUID()); // Nama aman, bukan dari client

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> response = restTemplate.postForEntity(
            apiUrl, new HttpEntity<>(body, headers), Map.class
        );

        // Ambil URL dari response JSON ImgBB
        Map<?, ?> data = (Map<?, ?>) response.getBody().get("data");
        return (String) data.get("url"); // URL direct image
    }

    private void validateImageFile(MultipartFile file) {
        List<String> allowed = List.of("image/png", "image/jpeg");
        if (!allowed.contains(file.getContentType()))
            throw new CustomBusinessException("OTK-4099",
                "Format tidak didukung. Hanya PNG, JPG, JPEG.", 400);
        if (file.getSize() > 5L * 1024 * 1024)
            throw new CustomBusinessException("OTK-4100",
                "Ukuran file melebihi batas 5MB.", 400);
    }
}
```

---

### 11.4 Perbandingan Lengkap Rekomendasi API

| Kriteria | Cloudinary (Outfit) | Cloudinary (Figure) | ImgBB (Figure) |
|---|---|---|---|
| **Harga** | Free 25GB/bulan | Shared quota dengan Outfit | ✅ Gratis tanpa batas storage |
| **Kemudahan Integrasi** | ✅ Mudah (SDK resmi) | ✅ SDK yang sama | ✅ Sangat mudah (REST biasa) |
| **Transformasi Gambar** | ✅ Resize/crop/thumbnail | ✅ Resize 800px untuk Admin | ❌ Tidak ada |
| **Proteksi URL** | ✅ Signed URL opsional | ✅ Signed URL opsional | ❌ URL publik permanen |
| **CDN Global** | ✅ Tersedia | ✅ Tersedia | ⚠️ Terbatas |
| **SLA / Uptime Garansi** | ✅ 99.9% (paid plan) | ✅ 99.9% (paid plan) | ❌ No SLA |
| **Privasi Gambar** | ✅ Private folder opsional | ✅ Private folder opsional | ❌ Semua gambar publik |
| **Cocok untuk Production** | ✅ Ya | ✅ Ya | ⚠️ Hanya untuk demo/dev |

---

### 11.5 Rekomendasi Final & Arsitektur Upload

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   ARSITEKTUR UPLOAD GAMBAR YANG DIREKOMENDASIKAN         │
│                                                                           │
│   FRONTEND                  BACKEND                    3RD PARTY API     │
│      │                          │                            │            │
│      │  POST /upload/           │                            │            │
│      │  outfit-reference        │                            │            │
│      │  (PNG/JPG/JPEG ≤5MB)     │                            │            │
│      │─────────────────────────>│                            │            │
│      │                          │  1. Validasi tipe & ukuran │            │
│      │                          │  2. Hapus metadata EXIF    │            │
│      │                          │─────────── Cloudinary ────>│            │
│      │                          │                   Upload & store       │
│      │                          │<─────── secure_url ────────│            │
│      │  { imageUrl: "https://   │                            │            │
│      │    res.cloudinary.com/…" }                            │            │
│      │<─────────────────────────│                            │            │
│      │                          │                            │            │
│      │  POST /upload/           │                            │            │
│      │  figure-reference        │                            │            │
│      │  (PNG/JPG/JPEG ≤5MB)     │                            │            │
│      │─────────────────────────>│                            │            │
│      │                          │  1. Validasi tipe & ukuran │            │
│      │                          │  2. Nama file UUID aman    │            │
│      │                          │─── Cloudinary/ImgBB ──────>│            │
│      │                          │<─────── image_url ─────────│            │
│      │  { imageUrl: "https://…" }                            │            │
│      │<─────────────────────────│                            │            │
│                                                                           │
│  Catatan: URL gambar disimpan di kolom                                   │
│  CustomOrders.ImageReferenceURL setelah submit form order                │
└──────────────────────────────────────────────────────────────────────────┘
```

### 🔐 Catatan Keamanan Penting untuk Kedua API

> [!CAUTION]
> **Jangan pernah menyimpan API Key Cloudinary / ImgBB di source code!**
> Simpan seluruh kredensial di environment variable dan baca via `@Value("${...}")`.

| Aturan Keamanan | Penjelasan |
|---|---|
| **Validasi MIME type di backend** | Selalu validasi di Spring **sebelum** dikirim ke API eksternal — jangan percaya validasi frontend |
| **Rename file dengan UUID** | Jangan gunakan `file.getOriginalFilename()` sebagai nama upload — gunakan `UUID.randomUUID()` |
| **Strip metadata EXIF** | Cloudinary mendukung `strip_metadata: true` — aktifkan untuk menghapus data GPS/lokasi dari foto user |
| **Autentikasi endpoint** | Kedua endpoint upload **wajib** dilindungi: minimal `hasAnyRole('Customer', 'Admin')` di SecurityConfig |
| **Rate limit endpoint upload** | Tambahkan rate limit di `RateLimitFilter` untuk endpoint `/api/v1/upload/**` — cegah spam upload |

---

## 12. 📋 Standarisasi Response Code (Internal Code OTK)

Semua response API menggunakan struktur `ApiResponse<T>` yang sudah ada, dengan penambahan field `internalCode` berformat `OTK-XXXX` untuk identifikasi hasil operasi secara spesifik.

### 12.1 Struktur Response Body

#### Response Sukses (HTTP 2xx)

```json
{
  "success": true,
  "internalCode": "OTK-2001",
  "message": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "timestamp": "2026-04-16T19:35:00"
}
```

#### Response Error (HTTP 4xx / 5xx)

```json
{
  "success": false,
  "internalCode": "OTK-4001",
  "message": "Email atau password salah",
  "data": null,
  "timestamp": "2026-04-16T19:35:01"
}
```

---

### 12.2 Kode Response — Versi OK (Sukses `2xxx`)

#### Autentikasi

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-2001` | 200 | Login berhasil | `POST /auth/login` sukses |
| `OTK-2002` | 201 | Registrasi berhasil | `POST /auth/register` sukses |
| `OTK-2003` | 200 | Token berhasil diperbarui | `POST /auth/refresh` sukses |
| `OTK-2004` | 200 | Logout berhasil | `POST /auth/logout` sukses |

#### Produk

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-2010` | 200 | Produk berhasil diambil | `GET /products` sukses |
| `OTK-2011` | 200 | Detail produk berhasil diambil | `GET /products/{id}` sukses |
| `OTK-2012` | 201 | Produk berhasil ditambahkan | `POST /products` sukses (Admin) |
| `OTK-2013` | 200 | Produk berhasil diperbarui | `PUT /products/{id}` sukses (Admin) |
| `OTK-2014` | 200 | Produk berhasil dihapus | `DELETE /products/{id}` sukses (Admin) |
| `OTK-2015` | 200 | Stok produk berhasil diperbarui | `PATCH /products/{id}/stock` sukses (Admin) |

#### Order

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-2020` | 201 | Order berhasil dibuat | `POST /orders` sukses |
| `OTK-2021` | 200 | Riwayat order berhasil diambil | `GET /orders` sukses |
| `OTK-2022` | 200 | Detail order berhasil diambil | `GET /orders/{id}` sukses |
| `OTK-2023` | 200 | Status order berhasil diperbarui | `PATCH /admin/orders/{id}/status` sukses (Admin) |
| `OTK-2024` | 200 | Semua order berhasil diambil | `GET /admin/orders` sukses (Admin) |

#### Custom Order

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-2030` | 201 | Custom order berhasil dibuat | `POST /custom-orders` sukses |
| `OTK-2031` | 200 | Gambar referensi outfit berhasil diupload | `POST /upload/outfit-reference` sukses |
| `OTK-2032` | 200 | Gambar referensi figure berhasil diupload | `POST /upload/figure-reference` sukses |
| `OTK-2033` | 200 | Custom order berhasil diambil | `GET /custom-orders` sukses |
| `OTK-2034` | 200 | Harga custom order berhasil ditetapkan | `PATCH /admin/custom-orders/{id}/price` sukses (Admin) |
| `OTK-2035` | 200 | Status custom order berhasil diperbarui | `PATCH /admin/custom-orders/{id}/status` sukses (Admin) |

#### Diskon

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-2040` | 200 | Kode diskon valid | `GET /discounts/validate?code=X` sukses |
| `OTK-2041` | 201 | Kode diskon berhasil dibuat | `POST /discounts` sukses (Admin) |
| `OTK-2042` | 200 | Kode diskon berhasil diperbarui | `PUT /discounts/{id}` sukses (Admin) |
| `OTK-2043` | 200 | Kode diskon berhasil dihapus | `DELETE /discounts/{id}` sukses (Admin) |

#### Manajemen User (Admin)

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-2050` | 200 | Daftar user berhasil diambil | `GET /admin/users` sukses |
| `OTK-2051` | 200 | Detail user berhasil diambil | `GET /admin/users/{id}` sukses |
| `OTK-2052` | 200 | Role user berhasil diubah | `PATCH /admin/users/{id}/role` sukses |
| `OTK-2053` | 200 | User berhasil di-force-logout | `POST /admin/users/{id}/force-logout` sukses |
| `OTK-2054` | 200 | Akun user berhasil dinonaktifkan | `DELETE /admin/users/{id}` sukses |

---

### 12.3 Kode Response — Versi Error Client (`4xxx`)

#### Error Autentikasi & Otorisasi

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-4001` | 401 | Email atau password salah | Login gagal — kredensial tidak cocok |
| `OTK-4002` | 401 | Token tidak valid atau sudah kadaluarsa | JWT tidak bisa diparse atau expired |
| `OTK-4003` | 401 | Token sudah dicabut (blacklisted) | Token ada di Redis blacklist |
| `OTK-4004` | 403 | Akses ditolak — tidak memiliki izin | Role tidak sesuai `@PreAuthorize` |
| `OTK-4005` | 401 | Refresh token tidak valid atau sudah dicabut | Refresh token expired / revoked di DB |
| `OTK-4006` | 409 | Email sudah terdaftar | Register dengan email yang sudah ada |
| `OTK-4007` | 429 | Terlalu banyak percobaan login | Rate limit login terlampaui |

#### Error Validasi Input

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-4010` | 400 | Request body tidak valid | `@Valid` gagal (field kosong, format salah) |
| `OTK-4011` | 400 | Format email tidak valid | Email tidak sesuai pola |
| `OTK-4012` | 400 | Password terlalu pendek (minimal 8 karakter) | Validasi panjang password |
| `OTK-4013` | 400 | Quantity tidak valid (harus > 0) | `quantity <= 0` di order item |
| `OTK-4014` | 400 | List item order tidak boleh kosong | `items: []` di `OrderRequestDTO` |

#### Error Sumber Daya Tidak Ditemukan

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-4041` | 404 | User tidak ditemukan | `userRepository.findById()` kosong |
| `OTK-4042` | 404 | Order tidak ditemukan | `orderRepository.findById()` kosong |
| `OTK-4043` | 404 | Kode diskon tidak ditemukan | `discountRepository.findByCode()` kosong |
| `OTK-4044` | 404 | Produk tidak ditemukan | `productRepository.findById()` kosong |
| `OTK-4045` | 404 | Custom order tidak ditemukan | `customOrderRepository.findById()` kosong |

#### Error Logika Bisnis

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-4090` | 403 | Anda tidak memiliki akses ke order ini | Ownership check gagal — IDOR attempt |
| `OTK-4091` | 400 | Status order tidak bisa diubah ke status tersebut | Transisi status tidak valid |
| `OTK-4092` | 400 | Kode diskon sudah tidak aktif | `Discount.isActive = false` |
| `OTK-4093` | 400 | Kode diskon sudah kadaluarsa | `Discount.expiryDate` terlewati |
| `OTK-4094` | 409 | Kuota kode diskon sudah habis | `usageCount >= maxUsage` |
| `OTK-4095` | 409 | Stok produk tidak mencukupi | `stockQuantity < quantity` saat order |
| `OTK-4096` | 400 | Harga custom order belum ditetapkan Admin | Status masih "Pending Review", belum "Quoted" |

#### Error Upload File

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-4099` | 400 | Format file tidak didukung. Hanya PNG, JPG, JPEG | MIME type bukan `image/png` / `image/jpeg` |
| `OTK-4100` | 400 | Ukuran file melebihi batas maksimal 5 MB | `file.getSize() > 5,242,880` |
| `OTK-4101` | 400 | File tidak boleh kosong | `file.isEmpty()` |
| `OTK-4290` | 429 | Batas upload tercapai (5 file/10 menit) | Rate limit upload terlampaui |

---

### 12.4 Kode Response — Versi Error Server (`5xxx`)

| Internal Code | HTTP | Pesan | Trigger |
|---|---|---|---|
| `OTK-5000` | 500 | Terjadi kesalahan pada server | `Exception` tidak tertangkap — fallback handler |
| `OTK-5001` | 503 | Layanan upload gambar sedang tidak tersedia | Cloudinary API tidak merespons / timeout |
| `OTK-5002` | 503 | Layanan cache sedang tidak tersedia | Redis tidak tersambung |
| `OTK-5003` | 500 | Gagal terhubung ke database | DataSource / SQL Server connection error |

---

### 12.5 Pemetaan ke `GlobalExceptionHandler.java`

Berikut cara memetakan kode-kode di atas ke dalam `GlobalExceptionHandler.java` yang sudah ada:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ─── Custom Business Exception (dari CustomBusinessException) ───────
    @ExceptionHandler(CustomBusinessException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusiness(CustomBusinessException ex) {
        // CustomBusinessException sudah membawa internalCode + statusCode
        return ResponseEntity.status(ex.getStatusCode())
            .body(ApiResponse.error(ex.getInternalCode(), ex.getMessage()));
    }

    // ─── Spring Security: Akses Ditolak ─────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(403)
            .body(ApiResponse.error("OTK-4004", "Akses ditolak — tidak memiliki izin"));
    }

    // ─── Validasi @Valid Gagal ───────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidation(
            MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.status(400)
            .body(ApiResponse.error("OTK-4010", msg));
    }

    // ─── Upload / IO Error (Cloudinary gagal) ───────────────────────────
    @ExceptionHandler(IOException.class)
    public ResponseEntity<ApiResponse<Object>> handleIO(IOException ex) {
        log.error("[UPLOAD-ERROR] Cloudinary IO failure: {}", ex.getMessage());
        return ResponseEntity.status(503)
            .body(ApiResponse.error("OTK-5001", "Layanan upload gambar sedang tidak tersedia"));
    }

    // ─── Fallback: Semua Exception Lain ─────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobal(Exception ex) {
        log.error("[SYSTEM-ERROR] Unhandled exception: ", ex);  // Log detail ke server, bukan ke client
        return ResponseEntity.status(500)
            .body(ApiResponse.error("OTK-5000", "Terjadi kesalahan pada server"));
    }
}
```

> [!WARNING]
> **Jangan pernah mengekspos `ex.getMessage()` langsung ke response untuk `RuntimeException` / `Exception` umum!**
> Detail error internal hanya boleh masuk ke log server. Pesan yang dikirim ke client harus selalu generik dan aman.

---

### 12.6 Ringkasan Semua Kode — Quick Reference

```
OTK-2xxx  →  SUKSES
  OTK-200x  Auth        (2001 login, 2002 register, 2003 refresh, 2004 logout)
  OTK-201x  Produk      (2010-2015)
  OTK-202x  Order       (2020-2024)
  OTK-203x  CustomOrder & Upload  (2030-2035)
  OTK-204x  Diskon      (2040-2043)
  OTK-205x  User Admin  (2050-2054)

OTK-4xxx  →  ERROR CLIENT
  OTK-400x  Auth / Token       (4001-4007)
  OTK-401x  Validasi Input     (4010-4014)
  OTK-404x  Not Found          (4041-4045)
  OTK-409x  Business Logic     (4090-4096)
  OTK-4099  Upload Format      (4099-4101)
  OTK-4290  Rate Limit         (upload & auth)

OTK-5xxx  →  ERROR SERVER
  OTK-5000  Internal Server Error (fallback)
  OTK-5001  Cloudinary tidak tersedia
  OTK-5002  Redis tidak tersedia
  OTK-5003  Database tidak tersambung
```

---

## 13. 🗄️ Konfigurasi Database — Strategi Persistensi & Penanganan Port Conflict

Bagian ini membahas dua masalah operasional yang sering terjadi saat menjalankan backend:
1. **Database selalu dibuat ulang** setiap kali aplikasi dijalankan — data hilang
2. **Error port sudah digunakan** (`Port 8321 is already in use`) saat mencoba restart aplikasi

---

### 13.1 Masalah: Database Selalu Dibuat Ulang

#### Akar Masalah — `ddl-auto` & Flyway yang Salah Konfigurasi

Spring Boot memiliki dua mekanisme yang bisa menyebabkan database dibuat/direset ulang:

| Mekanisme | Konfigurasi Berbahaya | Efek |
|---|---|---|
| **Hibernate DDL Auto** | `create` / `create-drop` | Tabel di-DROP dan dibuat ulang setiap restart → **semua data hilang** |
| **Flyway** | `clean-on-validation-error: true` | Flyway membersihkan seluruh database jika ada error validasi checksum |
| **Flyway** | `baseline-on-migrate: false` tanpa checksum cleanup | Error saat ada migration yang sudah dijalankan tapi checksumnya berubah |

#### Konfigurasi `application.yml` yang Aman (Anti Data-Loss)

```yaml
spring:
  # ─── Datasource ─────────────────────────────────────────────────────────
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=OtakuECommerce;encrypt=true;trustServerCertificate=true
    username: ${DB_USERNAME:sa}
    password: ${DB_PASSWORD:password}
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
    # HikariCP — Connection Pool (mencegah koneksi mati diam lalu error)
    hikari:
      connection-timeout: 30000       # 30 detik timeout sambungan
      idle-timeout: 600000            # 10 menit idle sebelum koneksi ditutup
      max-lifetime: 1800000           # 30 menit maksimal umur koneksi
      maximum-pool-size: 10           # Maks 10 koneksi paralel
      minimum-idle: 2                 # Selalu jaga minimal 2 koneksi siap pakai

  # ─── JPA / Hibernate ────────────────────────────────────────────────────
  jpa:
    hibernate:
      # ✅ WAJIB: Gunakan "validate" atau "none" — JANGAN "create" atau "create-drop"
      # validate : Hibernate hanya cek apakah skema cocok dengan entitas — TIDAK UBAH APAPUN
      # none     : Hibernate sama sekali tidak menyentuh skema database
      # update   : ⚠️ Tambah kolom baru, tapi TIDAK hapus kolom lama — aman untuk dev ringan
      # create   : ❌ DROP + CREATE semua tabel setiap restart — DATA HILANG
      # create-drop : ❌ DROP semua tabel saat shutdown — DATA HILANG
      ddl-auto: validate
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.SQLServerDialect

  # ─── Flyway — Migrasi Database ──────────────────────────────────────────
  flyway:
    enabled: true
    locations: classpath:db/migration     # Folder file SQL migration
    baseline-on-migrate: true             # ✅ Aman untuk database yang sudah ada data
    baseline-version: 0                   # Versi awal jika database sudah ada sebelum Flyway
    # ⛔ JANGAN aktifkan ini kecuali sengaja ingin reset total:
    # clean-on-validation-error: false    # DEFAULT false — jangan ubah ke true!
    # clean-disabled: true                # ✅ Tambahkan ini untuk MENCEGAH flyway:clean dijalankan
    out-of-order: false                   # Tolak migration yang nomornya lebih kecil dari yang sudah jalan
    validate-on-migrate: true             # Validasi checksum sebelum jalankan migration baru
```

> [!CAUTION]
> **`ddl-auto: create` atau `create-drop` adalah pembunuh data!** Jika nilai ini diset saat production, seluruh tabel akan di-DROP dan dibuat ulang setiap kali aplikasi restart. Pastikan selalu menggunakan `validate` atau `none` di production.

> [!WARNING]
> **Jangan pernah mengubah isi file migration SQL yang sudah dijalankan!** Flyway menyimpan checksum setiap file `.sql`. Jika file diubah setelah dijalankan, Flyway akan error `checksum mismatch` dan bisa memblokir startup aplikasi. Untuk perubahan skema baru, selalu buat file migration baru (`V4__...sql`, `V5__...sql`, dst).

---

### 13.2 Strategi Migration SQL yang Idempoten (Tidak Gagal Jika Sudah Ada)

File migration di `db/migration/` harus **idempoten** — artinya aman dijalankan berulang kali tanpa error. Gunakan pattern `IF NOT EXISTS` untuk semua DDL statement:

```sql
-- ✅ BENAR: Pakai IF NOT EXISTS agar tidak error jika tabel sudah ada
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    UserID      INT IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role        NVARCHAR(20) DEFAULT 'Customer',
    CreatedAt   DATETIME DEFAULT GETDATE()
);

-- ✅ BENAR: Tambah kolom baru ke tabel yang sudah ada (untuk migration V3, V4, dst)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'CustomOrders' AND COLUMN_NAME = 'Status'
)
ALTER TABLE CustomOrders ADD Status NVARCHAR(50) NOT NULL DEFAULT 'Pending Review';

-- ✅ BENAR: Data seed yang idempoten — pakai MERGE atau IF NOT EXISTS
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@otaku.com')
INSERT INTO Users (Name, Email, PasswordHash, Role)
VALUES ('Admin', 'admin@otaku.com', '$2a$12$...', 'Admin');
```

```sql
-- ❌ SALAH: DROP TABLE tanpa pengecekan — akan error jika tabel tidak ada
DROP TABLE Users;
CREATE TABLE Users (...);

-- ❌ SALAH: INSERT tanpa cek duplikat — akan error jika data sudah ada
INSERT INTO Users VALUES (...);
```

---

### 13.3 Urutan Versi Migration yang Benar

```
db/migration/
├── V1__init_schema.sql           ← Buat semua tabel dasar (IF NOT EXISTS)
├── V2__insert_mock_data.sql      ← Seed data awal (idempoten)
├── V3__insert_bulk_dummy_data.sql ← Data dummy tambahan (idempoten)
├── V4__add_custom_order_status.sql   ← Tambah kolom Status di CustomOrders
├── V5__add_refresh_tokens_table.sql  ← Tabel RefreshTokens (untuk Dual Token)
└── V6__add_discount_fields.sql       ← Kolom MaxUsage, ExpiryDate, IsActive di Discounts
```

> [!IMPORTANT]
> Nomor versi harus selalu **naik secara berurutan**. Flyway menjalankan migration dari versi terkecil ke terbesar. Jangan pernah menggunakan nomor versi yang sama untuk dua file berbeda.

---

### 13.4 Masalah: Error Port Sudah Digunakan

#### Gejala

```
***************************
APPLICATION FAILED TO START
***************************

Description:
Web server failed to start. Port 8321 was already in use.

Action:
Identify and stop the process that's listening on port 8321 or configure
this application to listen on another port.
```

Error ini terjadi karena **proses backend sebelumnya masih berjalan di background** dan belum benar-benar berhenti. Ini umum terjadi saat:
- Aplikasi di-stop paksa (Ctrl+C di terminal) tanpa proses benar-benar terminasi
- IDE (IntelliJ/VS Code) menjalankan instance lebih dari satu
- Proses Java mati abnormal dan tidak melepas port

---

#### Solusi 1: Temukan & Matikan Proses di Port Tersebut

**Windows (PowerShell):**
```powershell
# Cari proses yang pakai port 8321
netstat -ano | findstr :8321

# Output contoh:
#   TCP  0.0.0.0:8321  0.0.0.0:0  LISTENING  12345
#                                              ↑ PID

# Matikan proses berdasarkan PID (ganti 12345 dengan PID aktual):
taskkill /PID 12345 /F
```

**Atau satu perintah langsung:**
```powershell
# Matikan semua proses Java yang mendengarkan port 8321:
$pid = (netstat -ano | findstr :8321 | ForEach-Object { ($_ -split '\s+')[5] } | Select-Object -First 1)
if ($pid) { taskkill /PID $pid /F }
```

---

#### Solusi 2: Konfigurasi Fallback Port di `application.yml`

Tambahkan konfigurasi fallback agar jika port utama gagal, aplikasi mencoba port alternatif:

```yaml
server:
  port: ${SERVER_PORT:8321}   # Ambil dari ENV variable, default 8321
  # Opsi: jika ingin port random otomatis saat development (0 = random):
  # port: 0
```

Dengan menggunakan `${SERVER_PORT:8321}`, port bisa diubah tanpa mengubah kode:
```powershell
# Jalankan di port berbeda tanpa edit kode:
$env:SERVER_PORT=8322; mvn spring-boot:run
```

---

#### Solusi 3: Tambahkan Script Startup yang Otomatis Membersihkan Port

Buat file `start-backend.ps1` di root project untuk menangani konflik port secara otomatis:

```powershell
# start-backend.ps1 — Jalankan ini sebagai pengganti mvn spring-boot:run

$PORT = 8321

Write-Host "🔍 Memeriksa port $PORT..." -ForegroundColor Cyan

# Cari proses yang menggunakan port
$processLine = netstat -ano | Select-String ":$PORT\s" | Where-Object { $_ -match "LISTENING" }

if ($processLine) {
    $pid = ($processLine -split '\s+')[-1].Trim()
    Write-Host "⚠️  Port $PORT digunakan oleh PID $pid. Menghentikan proses..." -ForegroundColor Yellow
    taskkill /PID $pid /F | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "✅ Port $PORT berhasil dibebaskan." -ForegroundColor Green
} else {
    Write-Host "✅ Port $PORT tersedia." -ForegroundColor Green
}

Write-Host "🚀 Menjalankan Spring Boot Backend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
mvn spring-boot:run
```

Cara penggunaan:
```powershell
# Jalankan dari root project:
.\start-backend.ps1
```

---

#### Solusi 4: Konfigurasi `spring-boot-maven-plugin` untuk Restart Bersih

Tambahkan konfigurasi `spring-boot-maven-plugin` di `pom.xml` untuk menangani lifecycle dengan lebih bersih:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <!-- Aktifkan DevTools untuk hot-reload tanpa restart penuh -->
                <addResources>true</addResources>
                <!-- JVM args: paksa GC agresif saat shutdown agar port cepat dibebaskan -->
                <jvmArguments>
                    -Xms256m
                    -Xmx512m
                    -XX:+ExitOnOutOfMemoryError
                </jvmArguments>
            </configuration>
        </plugin>
    </plugins>
</build>
```

---

#### Solusi 5: Tambahkan Graceful Shutdown di `application.yml`

Graceful shutdown memastikan aplikasi menutup koneksi dan melepas port secara sempurna sebelum benar-benar berhenti:

```yaml
server:
  port: ${SERVER_PORT:8321}
  # ✅ Graceful shutdown — tunggu request aktif selesai sebelum mati
  shutdown: graceful

spring:
  lifecycle:
    # Maksimal 30 detik menunggu request aktif selesai sebelum paksa berhenti
    timeout-per-shutdown-phase: 30s
```

> [!TIP]
> Dengan `shutdown: graceful`, saat aplikasi di-stop (Ctrl+C atau `kill -SIGTERM`), Spring Boot akan:
> 1. Berhenti menerima request baru
> 2. Menunggu semua request yang sedang berjalan selesai (maks 30 detik)
> 3. Menutup koneksi database dan melepas port secara bersih
> 4. Baru benar-benar berhenti
>
> Ini mencegah kondisi di mana port tertahan oleh proses yang sudah "mati" tapi belum sepenuhnya melepas resource.

---

### 13.5 Ringkasan Konfigurasi `application.yml` Lengkap yang Direkomendasikan

Berikut adalah konfigurasi `application.yml` final yang menggabungkan semua solusi di atas:

```yaml
# ─── Server ──────────────────────────────────────────────────────────────────
server:
  port: ${SERVER_PORT:8321}     # Override via ENV: $env:SERVER_PORT=8322
  shutdown: graceful            # Bersihkan port dengan sempurna saat stop

# ─── Spring ──────────────────────────────────────────────────────────────────
spring:
  application:
    name: ecommerce-backend

  lifecycle:
    timeout-per-shutdown-phase: 30s   # Maks 30 detik untuk graceful shutdown

  # ─── Datasource ────────────────────────────────────────────────────────────
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=OtakuECommerce;encrypt=true;trustServerCertificate=true
    username: ${DB_USERNAME:sa}
    password: ${DB_PASSWORD:password}
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
    hikari:
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      maximum-pool-size: 10
      minimum-idle: 2

  # ─── JPA / Hibernate ───────────────────────────────────────────────────────
  jpa:
    hibernate:
      ddl-auto: validate            # ✅ AMAN: hanya validasi, tidak ubah skema
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.SQLServerDialect

  # ─── Flyway — Migrasi Terkelola ────────────────────────────────────────────
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true       # ✅ Aman untuk DB yang sudah ada
    baseline-version: 0
    out-of-order: false
    validate-on-migrate: true
    # clean-disabled: true          # Aktifkan ini di production untuk keamanan ekstra

  # ─── Multipart Upload ──────────────────────────────────────────────────────
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

# ─── Actuator ────────────────────────────────────────────────────────────────
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

---

### 13.6 Checklist Sebelum Menjalankan Backend

Gunakan checklist berikut setiap kali sebelum menjalankan `mvn spring-boot:run`:

- [ ] **Pastikan SQL Server berjalan** — Buka SQL Server Management Studio atau jalankan: `Get-Service -Name 'MSSQLSERVER' | Start-Service`
- [ ] **Pastikan database `OtakuECommerce` sudah ada** — Buat manual jika belum: `CREATE DATABASE OtakuECommerce;`
- [ ] **Pastikan port 8321 tidak digunakan** — Jalankan: `netstat -ano | findstr :8321`
- [ ] **`ddl-auto` bukan `create` atau `create-drop`** — Pastikan nilainya `validate` atau `none`
- [ ] **File migration tidak diubah setelah dijalankan** — Cukup tambah file baru (`V4__...sql`)
- [ ] **ENV variable terkonfigurasi** (jika menggunakan): `$env:DB_PASSWORD`, `$env:JWT_SECRET`


