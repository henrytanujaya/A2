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
  - `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` (versi `0.12.x`): Generate, parsing, dan validasi JWT token
  - `spring-boot-starter-data-redis`: In-memory cache untuk JWT token blacklist & session management (lihat **Bagian 6**)

---

## 2. Rencana Implementasi Database (SQL Server)

Sistem database mengadopsi 6 tabel utama + 1 tabel pendukung autentikasi. Buat dengan DDL (Data Definition Language) mengikuti urutan di bawah untuk menghindari konflik relasi tabel.

### Fase 2.1: Tabel Independen (Master)
1. **Users**
   - Kolom: `UserID` (INT PK IDENTITY), `Name` (NVARCHAR), `Email` (NVARCHAR UNIQUE), `PasswordHash` (NVARCHAR), `Role` (NVARCHAR DEFAULT 'CUSTOMER'), `CreatedAt` (DATETIME DEFAULT GETDATE()).
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

### Fase 2.3: Tabel Pendukung Autentikasi
7. **RefreshTokens** (Penyimpanan Refresh Token)
   - Kolom: `TokenID` (BIGINT PK IDENTITY), `UserID` (FK ke Users), `Token` (NVARCHAR(512) UNIQUE), `ExpiryDate` (DATETIME2), `CreatedAt` (DATETIME2 DEFAULT GETDATE()), `Revoked` (BIT DEFAULT 0).
   - **Index**: Buat index pada kolom `Token` untuk pencarian cepat, dan `UserID` untuk revokasi massal.

**Note:** Kolom Nullable di `OrderItems` diimplementasikan karena pelanggan mungkin saja *checkout* barang katalog biasa (`ProductID` terisi, `CustomOrderID` null), atau checkout barang kostumisasi (`ProductID` null, `CustomOrderID` terisi).

---

## 3. Arsitektur & Flow Autentikasi JWT (JSON Web Token)

Bagian ini menjelaskan secara detail mekanisme autentikasi menggunakan JWT yang diterapkan pada sistem, mengikuti standar keamanan industri (*best practices*).

### 3.1 Konsep Dasar JWT

JWT terdiri dari 3 bagian yang dipisahkan oleh titik (`.`):

```
[HEADER].[PAYLOAD].[SIGNATURE]
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGVtYWlsLmNvbSJ9.signature_hash
```

| Bagian | Isi | Fungsi |
|---|---|---|
| **Header** | `{"alg": "HS256", "typ": "JWT"}` | Mendeklarasikan algoritma signing |
| **Payload (Claims)** | Data klaim user (lihat 3.2) | Membawa identitas & metadata user |
| **Signature** | `HMACSHA256(header + "." + payload, SECRET_KEY)` | Menjamin integritas & otentisitas token |

### 3.2 Struktur Claims (Payload) Token

#### Access Token Claims
```json
{
  "sub": "user@email.com",        // Subject → identifier utama user (email)
  "userId": 42,                    // Custom claim → ID database user
  "role": "CUSTOMER",              // Custom claim → role otorisasi
  "iat": 1713189600,               // Issued At → waktu cetak token (epoch)
  "exp": 1713190500                // Expiration → waktu kadaluarsa (epoch)
}
```

#### Refresh Token Claims
```json
{
  "sub": "user@email.com",        // Subject → identifier utama user
  "tokenId": 7,                   // Custom claim → ID di tabel RefreshTokens
  "type": "REFRESH",              // Custom claim → penanda tipe token
  "iat": 1713189600,
  "exp": 1713794400                // Expiration lebih panjang (7 hari)
}
```

### 3.3 Strategi Dual Token (Access + Refresh)

Sistem mengadopsi strategi **dual token** untuk menyeimbangkan keamanan dan kenyamanan pengguna:

| Properti | Access Token | Refresh Token |
|---|---|---|
| **Masa Hidup** | 15 menit | 7 hari |
| **Penggunaan** | Dikirim di setiap request API (Header `Authorization`) | Hanya dikirim ke endpoint `/api/auth/refresh` |
| **Penyimpanan Client** | Memory / HttpOnly Cookie | HttpOnly Secure Cookie / Secure Storage |
| **Isi Claims** | Lengkap (userId, role, email) | Minimal (email, tokenId) |
| **Saat Kadaluarsa** | Client request token baru via Refresh Token | User harus login ulang |

**Alasan Best Practice:**
> Access Token berumur pendek agar jika bocor, *window of attack* sangat sempit (maks 15 menit). Refresh Token berumur lebih panjang namun disimpan lebih aman dan hanya digunakan untuk satu tujuan: mendapatkan Access Token baru.

---

### 3.4 Detail Flow Autentikasi

#### 🔵 Flow 1: Registrasi User Baru

```
┌──────────┐                        ┌──────────────┐                    ┌────────────┐
│  Client   │                        │  AuthController│                   │   Database  │
│ (Browser) │                        │  /api/auth    │                    │  SQL Server │
└─────┬─────┘                        └──────┬───────┘                    └──────┬──────┘
      │                                     │                                   │
      │  POST /api/auth/register            │                                   │
      │  Body: {name,email,password}        │                                   │
      │────────────────────────────────────>│                                   │
      │                                     │                                   │
      │                         ┌───────────┴──────────────┐                    │
      │                         │ 1. Validasi DTO (@Valid)  │                    │
      │                         │    - Email format valid?  │                    │
      │                         │    - Password min 8 char? │                    │
      │                         │    - Name not blank?      │                    │
      │                         └───────────┬──────────────┘                    │
      │                                     │                                   │
      │                                     │  SELECT * FROM Users              │
      │                                     │  WHERE Email = ?                  │
      │                                     │──────────────────────────────────>│
      │                                     │                                   │
      │                                     │  Result: null (belum terdaftar)   │
      │                                     │<──────────────────────────────────│
      │                                     │                                   │
      │                         ┌───────────┴──────────────┐                    │
      │                         │ 2. Hash Password          │                    │
      │                         │    BCrypt.encode(password) │                    │
      │                         │    strength: 12 rounds     │                    │
      │                         └───────────┬──────────────┘                    │
      │                                     │                                   │
      │                                     │  INSERT INTO Users                │
      │                                     │  (Name,Email,PasswordHash,Role)   │
      │                                     │──────────────────────────────────>│
      │                                     │                                   │
      │                                     │  UserID: 42 (generated)           │
      │                                     │<──────────────────────────────────│
      │                                     │                                   │
      │  HTTP 201 Created                   │                                   │
      │  {"message":"Registrasi berhasil",  │                                   │
      │   "userId": 42}                     │                                   │
      │<────────────────────────────────────│                                   │
```

**Langkah-langkah:**
1. Client mengirim `POST /api/auth/register` dengan body JSON berisi `name`, `email`, dan `password`.
2. `AuthController` menerima `RegisterRequestDTO` dan Spring melakukan validasi otomatis (`@Valid`).
3. `AuthService.register()` dipanggil:
   - Cek apakah email sudah terdaftar → jika ya, lempar `EmailAlreadyExistsException`.
   - Hash password menggunakan `BCryptPasswordEncoder` dengan **strength 12** (best practice: ≥10 rounds).
   - Simpan entity `User` baru dengan role default `CUSTOMER`.
4. Response dikembalikan **tanpa token** — user harus login secara eksplisit setelah registrasi.

---

#### 🟢 Flow 2: Login & Penerbitan Token

```
┌──────────┐                        ┌──────────────┐     ┌───────────┐    ┌────────────┐
│  Client   │                        │ AuthController│     │ JwtService │    │  Database   │
│ (Browser) │                        │ /api/auth     │     │            │    │  SQL Server │
└─────┬─────┘                        └──────┬───────┘     └─────┬─────┘    └──────┬──────┘
      │                                     │                   │                  │
      │  POST /api/auth/login               │                   │                  │
      │  Body: {email, password}            │                   │                  │
      │────────────────────────────────────>│                   │                  │
      │                                     │                   │                  │
      │                                     │  findByEmail(email)                  │
      │                                     │─────────────────────────────────────>│
      │                                     │                   │                  │
      │                                     │  User Entity (id:42, hash, role)     │
      │                                     │<─────────────────────────────────────│
      │                                     │                   │                  │
      │                         ┌───────────┴──────────┐        │                  │
      │                         │ BCrypt.matches(       │        │                  │
      │                         │   inputPwd, hash)     │        │                  │
      │                         │ → TRUE ✓              │        │                  │
      │                         └───────────┬──────────┘        │                  │
      │                                     │                   │                  │
      │                                     │  generateAccessToken(user)           │
      │                                     │──────────────────>│                  │
      │                                     │                   │                  │
      │                                     │  accessToken (15m) │                  │
      │                                     │<──────────────────│                  │
      │                                     │                   │                  │
      │                                     │  generateRefreshToken(user)          │
      │                                     │──────────────────>│                  │
      │                                     │                   │                  │
      │                                     │  refreshToken (7d) │                  │
      │                                     │<──────────────────│                  │
      │                                     │                   │                  │
      │                                     │  INSERT INTO RefreshTokens           │
      │                                     │  (UserID, Token, ExpiryDate)          │
      │                                     │─────────────────────────────────────>│
      │                                     │                   │                  │
      │  HTTP 200 OK                        │                   │                  │
      │  {                                  │                   │                  │
      │    "accessToken": "eyJhb...",       │                   │                  │
      │    "refreshToken": "eyJsw...",      │                   │                  │
      │    "tokenType": "Bearer",           │                   │                  │
      │    "expiresIn": 900                 │                   │                  │
      │  }                                  │                   │                  │
      │<────────────────────────────────────│                   │                  │
```

**Langkah-langkah:**
1. Client mengirim `POST /api/auth/login` dengan body JSON `{email, password}`.
2. `AuthService.login()` menjalankan **satu kali query** `findByEmail(email)`:
   - Jika user tidak ditemukan → lempar `BadCredentialsException`.
   - Jika `BCrypt.matches(rawPassword, storedHash)` gagal → lempar `BadCredentialsException` yang **sama** (tidak membedakan "email salah" vs "password salah" untuk mencegah *user enumeration attack*).
3. `JwtService.generateAccessToken()` mencetak Access Token dengan claims: `sub`, `userId`, `role`, `iat`, `exp` (15 menit).
4. `JwtService.generateRefreshToken()` mencetak Refresh Token dengan claims minimal dan masa hidup 7 hari.
5. Refresh Token disimpan ke tabel `RefreshTokens` di database (untuk tracking dan revokasi).
6. Kedua token dikirim ke client dalam response body.

---

#### 🟡 Flow 3: Akses Resource Terproteksi (Setiap Request API)

```
┌──────────┐                  ┌─────────────────────┐     ┌───────────┐    ┌──────────────┐
│  Client   │                  │ JwtAuthFilter        │     │ JwtService │    │ Controller    │
│ (Browser) │                  │ (OncePerRequestFilter)│     │            │    │ /api/products │
└─────┬─────┘                  └──────────┬──────────┘     └─────┬─────┘    └──────┬───────┘
      │                                   │                      │                  │
      │  GET /api/products                │                      │                  │
      │  Header: Authorization:           │                      │                  │
      │  Bearer eyJhbGci...               │                      │                  │
      │──────────────────────────────────>│                      │                  │
      │                                   │                      │                  │
      │                       ┌───────────┴──────────┐           │                  │
      │                       │ 1. Ekstrak token dari │           │                  │
      │                       │    header "Bearer ..." │           │                  │
      │                       └───────────┬──────────┘           │                  │
      │                                   │                      │                  │
      │                                   │  validateToken(token) │                  │
      │                                   │─────────────────────>│                  │
      │                                   │                      │                  │
      │                                   │  ┌──────────────────────────────┐       │
      │                                   │  │ - Verifikasi signature (HS256)│       │
      │                                   │  │ - Cek expiration (exp > now?) │       │
      │                                   │  │ - Ekstrak claims (sub, role)  │       │
      │                                   │  └──────────────────────────────┘       │
      │                                   │                      │                  │
      │                                   │  Claims valid ✓       │                  │
      │                                   │<─────────────────────│                  │
      │                                   │                      │                  │
      │                       ┌───────────┴──────────────────┐   │                  │
      │                       │ 2. Set SecurityContextHolder  │   │                  │
      │                       │    Authentication = {          │   │                  │
      │                       │      principal: email,         │   │                  │
      │                       │      authorities: [ROLE_xxx]   │   │                  │
      │                       │    }                            │   │                  │
      │                       └───────────┬──────────────────┘   │                  │
      │                                   │                      │                  │
      │                                   │  filterChain.doFilter() ──────────────>│
      │                                   │                      │                  │
      │                                   │                      │   @PreAuthorize  │
      │                                   │                      │   access granted │
      │                                   │                      │                  │
      │  HTTP 200 OK                      │                      │                  │
      │  [{"productId":1, ...}]           │                      │                  │
      │<──────────────────────────────────────────────────────────────────────────│
```

**Langkah-langkah:**
1. Client menyertakan Access Token di header: `Authorization: Bearer <accessToken>`.
2. `JwtAuthenticationFilter` (extends `OncePerRequestFilter`) mengintercept request **sebelum** mencapai controller:
   - Ekstrak string token dari header (buang prefix `"Bearer "`).
   - Panggil `JwtService.validateToken(token)` → verifikasi signature + cek expiry.
   - Jika valid: ekstrak claims, bangun `UsernamePasswordAuthenticationToken`, set ke `SecurityContextHolder`.
   - Jika invalid/expired: **JANGAN** set context → request berlanjut tanpa autentikasi → Spring Security akan menolak dengan `401 Unauthorized`.
3. Request diteruskan ke Controller yang sesuai. `@PreAuthorize` atau `SecurityConfig` memverifikasi otorisasi role.

---

#### 🔄 Flow 4: Refresh Access Token (Silent Renewal)

```
┌──────────┐                        ┌──────────────┐     ┌───────────┐    ┌────────────┐
│  Client   │                        │ AuthController│     │ JwtService │    │  Database   │
└─────┬─────┘                        └──────┬───────┘     └─────┬─────┘    └──────┬──────┘
      │                                     │                   │                  │
      │  POST /api/auth/refresh             │                   │                  │
      │  Body: {"refreshToken":"eyJ..."}    │                   │                  │
      │────────────────────────────────────>│                   │                  │
      │                                     │                   │                  │
      │                                     │  validateToken(refreshToken)         │
      │                                     │──────────────────>│                  │
      │                                     │                   │                  │
      │                                     │  claims ✓ (type=REFRESH)             │
      │                                     │<──────────────────│                  │
      │                                     │                   │                  │
      │                                     │  SELECT FROM RefreshTokens           │
      │                                     │  WHERE Token = ? AND Revoked = 0     │
      │                                     │─────────────────────────────────────>│
      │                                     │                   │                  │
      │                                     │  RefreshToken entity (valid) ✓       │
      │                                     │<─────────────────────────────────────│
      │                                     │                   │                  │
      │                         ┌───────────┴──────────────────┐│                  │
      │                         │ Refresh Token Rotation:       ││                  │
      │                         │ 1. Revoke token lama (Revoked=1)                 │
      │                         │ 2. Generate token baru        ││                  │
      │                         │ 3. Simpan token baru ke DB    ││                  │
      │                         └───────────┬──────────────────┘│                  │
      │                                     │                   │                  │
      │                                     │  UPDATE RefreshTokens SET Revoked=1  │
      │                                     │  WHERE TokenID = ?                   │
      │                                     │──────────────────────────────────── >│
      │                                     │                   │                  │
      │                                     │  generateAccessToken(user)           │
      │                                     │──────────────────>│                  │
      │                                     │  new accessToken ✓ │                  │
      │                                     │<──────────────────│                  │
      │                                     │                   │                  │
      │                                     │  generateRefreshToken(user)          │
      │                                     │──────────────────>│                  │
      │                                     │  new refreshToken ✓│                  │
      │                                     │<──────────────────│                  │
      │                                     │                   │                  │
      │                                     │  INSERT INTO RefreshTokens (new)     │
      │                                     │─────────────────────────────────────>│
      │                                     │                   │                  │
      │  HTTP 200 OK                        │                   │                  │
      │  {                                  │                   │                  │
      │    "accessToken": "eyJnew...",      │                   │                  │
      │    "refreshToken": "eyJrot...",     │                   │                  │
      │    "tokenType": "Bearer",           │                   │                  │
      │    "expiresIn": 900                 │                   │                  │
      │  }                                  │                   │                  │
      │<────────────────────────────────────│                   │                  │
```

**Langkah-langkah:**
1. Saat Access Token kadaluarsa (client menerima `401`), client mengirim `POST /api/auth/refresh` dengan Refresh Token.
2. Server memvalidasi Refresh Token: signature + expiry + cek di database (belum di-revoke).
3. **Refresh Token Rotation** (Best Practice Kritis):
   - Token lama **langsung di-revoke** (`Revoked = 1`) di database.
   - Token baru (Access + Refresh) dicetak dan Refresh Token baru disimpan ke database.
   - Jika token lama yang sudah di-revoke dicoba digunakan lagi → **indikasi pencurian token** → revoke **semua** Refresh Token milik user tersebut.
4. Client menerima pasangan token baru dan memperbarui penyimpanan lokal.

---

#### 🔴 Flow 5: Logout (Revokasi Token)

```
┌──────────┐                        ┌──────────────┐                    ┌────────────┐
│  Client   │                        │ AuthController│                    │  Database   │
└─────┬─────┘                        └──────┬───────┘                    └──────┬──────┘
      │                                     │                                   │
      │  POST /api/auth/logout              │                                   │
      │  Header: Authorization: Bearer ...  │                                   │
      │  Body: {"refreshToken":"eyJ..."}    │                                   │
      │────────────────────────────────────>│                                   │
      │                                     │                                   │
      │                                     │  UPDATE RefreshTokens              │
      │                                     │  SET Revoked = 1                   │
      │                                     │  WHERE Token = ?                   │
      │                                     │──────────────────────────────────>│
      │                                     │                                   │
      │                         ┌───────────┴──────────────┐                    │
      │                         │ (Opsional) Tambahkan      │                    │
      │                         │ Access Token ke Blacklist  │                    │
      │                         │ Redis/In-Memory Cache      │                    │
      │                         │ TTL = sisa waktu expiry    │                    │
      │                         └───────────┬──────────────┘                    │
      │                                     │                                   │
      │  HTTP 200 OK                        │                                   │
      │  {"message":"Logout berhasil"}      │                                   │
      │<────────────────────────────────────│                                   │
      │                                     │                                   │
      │  ┌──────────────────────┐           │                                   │
      │  │ Client-side:          │           │                                   │
      │  │ - Hapus accessToken   │           │                                   │
      │  │ - Hapus refreshToken  │           │                                   │
      │  │ - Redirect ke login   │           │                                   │
      │  └──────────────────────┘           │                                   │
```

**Langkah-langkah:**
1. Client mengirim `POST /api/auth/logout` dengan Access Token di header dan Refresh Token di body.
2. Server me-revoke Refresh Token di database (`Revoked = 1`).
3. *(Opsional, Best Practice Tingkat Lanjut)* Access Token ditambahkan ke **blacklist** (Redis/in-memory cache) dengan TTL = sisa waktu expiry. Ini mencegah Access Token yang masih berlaku digunakan setelah logout.
4. Client menghapus kedua token dari penyimpanan lokal dan redirect ke halaman login.

---

### 3.5 Implementasi Komponen Kunci

#### 📁 Struktur File Autentikasi

```
src/main/java/com/otaku/ecommerce/
├── config/
│   ├── SecurityConfig.java          // Konfigurasi Spring Security & filter chain
│   └── CorsConfig.java              // Konfigurasi CORS policy
├── security/
│   ├── JwtService.java              // Generate, validasi, parsing token
│   ├── JwtAuthenticationFilter.java // Filter intercept setiap request
│   └── JwtAuthEntryPoint.java       // Handler untuk 401 Unauthorized
├── auth/
│   ├── AuthController.java          // Endpoint register, login, refresh, logout
│   ├── AuthService.java             // Logika bisnis autentikasi
│   ├── dto/
│   │   ├── RegisterRequestDTO.java
│   │   ├── LoginRequestDTO.java
│   │   ├── AuthResponseDTO.java     // Response berisi access + refresh token
│   │   └── RefreshTokenRequestDTO.java
│   └── entity/
│       └── RefreshToken.java        // Entity tabel RefreshTokens
```

#### 🔐 SecurityConfig.java — Konfigurasi Filter Chain

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Mengaktifkan @PreAuthorize di controller
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthenticationFilter jwtFilter,
                                           JwtAuthEntryPoint entryPoint) throws Exception {
        http
            .csrf(csrf -> csrf.disable())                    // Disable CSRF (stateless API)
            .cors(cors -> cors.configurationSource(corsSource()))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(entryPoint)        // Custom 401 handler
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // ⚠️ WAJIB stateless
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/refresh"
                ).permitAll()                                // Endpoint publik
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()                // Sisanya butuh token
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // Best practice: strength ≥ 10
    }
}
```

#### 🔑 JwtService.java — Core Token Logic

```java
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-token-expiration}")    // 900000 (15 menit dalam ms)
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")   // 604800000 (7 hari dalam ms)
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);   // ⚠️ Gunakan key ≥ 256-bit
    }

    public String generateAccessToken(User user) {
        return Jwts.builder()
            .subject(user.getEmail())
            .claim("userId", user.getUserId())
            .claim("role", user.getRole())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
            .signWith(getSigningKey())          // Default HS256 untuk key HMAC
            .compact();
    }

    public String generateRefreshToken(User user, Long tokenId) {
        return Jwts.builder()
            .subject(user.getEmail())
            .claim("tokenId", tokenId)
            .claim("type", "REFRESH")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
            .signWith(getSigningKey())
            .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);   // Throws exception jika invalid/expired
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }
}
```

#### 🛡️ JwtAuthenticationFilter.java — Request Interceptor

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
                                     throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // 1. Cek keberadaan header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);  // Lanjut tanpa auth
            return;
        }

        // 2. Ekstrak token
        final String token = authHeader.substring(7);

        // 3. Validasi & set context
        if (jwtService.isTokenValid(token)) {
            String email = jwtService.extractEmail(token);
            Claims claims = jwtService.extractAllClaims(token);
            String role = claims.get("role", String.class);

            // ⚠️ JANGAN query database di sini jika tidak perlu
            // Gunakan claims dari token untuk membuat Authentication object
            UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
            authToken.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Skip filter untuk endpoint publik
        return path.startsWith("/api/auth/login")
            || path.startsWith("/api/auth/register")
            || path.startsWith("/api/auth/refresh");
    }
}
```

---

### 3.6 Konfigurasi `application.yml`

```yaml
jwt:
  secret: ${JWT_SECRET}                      # ⚠️ WAJIB dari Environment Variable
  access-token-expiration: 900000            # 15 menit (dalam milidetik)
  refresh-token-expiration: 604800000        # 7 hari (dalam milidetik)

spring:
  datasource:
    url: jdbc:sqlserver://${DB_HOST};databaseName=${DB_NAME};encrypt=true;trustServerCertificate=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate                      # ⚠️ JANGAN pakai 'create' di production
    properties:
      hibernate:
        dialect: org.hibernate.dialect.SQLServerDialect
```

**Cara generate JWT Secret Key yang aman:**
```bash
# Minimal 256-bit (32 byte) → di-encode ke Base64
openssl rand -base64 64
```

---

### 3.7 Best Practices & Checklist Keamanan JWT

| # | Best Practice | Implementasi | Alasan |
|---|---|---|---|
| 1 | **Token berumur pendek** | Access Token = 15 menit | Meminimalkan dampak jika token bocor |
| 2 | **Refresh Token Rotation** | Token lama di-revoke tiap kali refresh | Mendeteksi & membatalkan token curian |
| 3 | **Secret Key kuat** | ≥ 256-bit, disimpan di ENV variable | Mencegah brute-force signing key |
| 4 | **Jangan simpan data sensitif di claims** | Tidak ada password/PII di payload | JWT payload bisa di-decode tanpa key |
| 5 | **Gunakan HTTPS di production** | TLS/SSL wajib | Mencegah man-in-the-middle intercept token |
| 6 | **Jangan gunakan `none` algorithm** | Library jjwt secara default menolak | Mencegah *Algorithm Confusion Attack* |
| 7 | **Validasi semua claims** | Cek `exp`, `sub`, `role` | Mencegah token manipulasi |
| 8 | **Stateless session** | `SessionCreationPolicy.STATELESS` | JWT menggantikan session, jangan campur |
| 9 | **Error message generik** | "Email atau password salah" (bukan spesifik) | Mencegah *user enumeration* |
| 10 | **Password hashing BCrypt** | Strength ≥ 12 rounds | BCrypt secara desain lambat → tahan brute-force |
| 11 | **Rate limiting pada auth endpoints** | Maks 5 percobaan login / menit / IP | Mencegah *credential stuffing attack* |
| 12 | **CORS ketat** | Hanya izinkan origin frontend yang sah | Mencegah *cross-origin token theft* |
| 13 | **Disable CSRF untuk API REST** | `csrf.disable()` karena stateless | CSRF tidak relevan untuk token-based auth |
| 14 | **Audit log** | Catat login sukses/gagal dengan SLF4J | Forensik keamanan dan deteksi anomali |
| 15 | **Blacklist Access Token saat logout** | Redis/in-memory dengan TTL | Token yang di-logout tidak bisa dipakai lagi |

---

### 3.8 Penanganan Error Autentikasi

| Skenario | HTTP Status | Response Body |
|---|---|---|
| Email / password salah | `401 Unauthorized` | `{"error": "Email atau password salah"}` |
| Token tidak disertakan | `401 Unauthorized` | `{"error": "Token autentikasi diperlukan"}` |
| Token expired | `401 Unauthorized` | `{"error": "Token telah kadaluarsa"}` |
| Token invalid / rusak | `401 Unauthorized` | `{"error": "Token tidak valid"}` |
| Refresh Token sudah di-revoke | `401 Unauthorized` | `{"error": "Refresh token tidak valid, silakan login ulang"}` |
| Role tidak memiliki izin | `403 Forbidden` | `{"error": "Anda tidak memiliki izin untuk akses ini"}` |
| Email sudah terdaftar (register) | `409 Conflict` | `{"error": "Email sudah terdaftar"}` |
| Rate limit tercapai | `429 Too Many Requests` | `{"error": "Terlalu banyak percobaan, coba lagi nanti"}` |

---

## 4. Rencana Implementasi Layer Spring Boot

### Fase 4.1: Entitas JPA & Relasi (Model Layer)
- Translasikan seluruh tabel di atas ke dalam File `@Entity` Java.
- **Strategi Lazy Loading**: Pada entitas transaksi (`Order`, `CustomOrder`), buat relasi asosiasi beranotasi terhadap `User` dengan cara `@ManyToOne(fetch = FetchType.LAZY)`. Ini mencegah Hibernate menarik seluruh data *User* tidak perlu.
- **Critical Security Policy**: Pada kelas `User.java`, bubuhkan anotasi `@JsonIgnore` secara wajib persis di atas properti `passwordHash` agar framework JSON tidak akan pernah menyertakannya ketika Objek ditarik ke API Controller.

### Fase 4.2: Konfigurasi Core & Security (`application.yml`)
- **Hindari Hardcode**: Hubungkan URL SQL Server, username, password, dan JWT Secret via *Environment Variables*.
- Konfigurasi `SecurityConfig.java` sesuai spesifikasi di **Bagian 3.5**.
- Implementasikan `JwtAuthenticationFilter` dan `JwtService` sebagai komponen inti autentikasi.

### Fase 4.3: Layanan Logika Bisnis (Service Layer)
1. **AuthService**
   - Implementasikan seluruh flow autentikasi sesuai **Bagian 3.4** (Register, Login, Refresh, Logout).
   - Rencana: Saat login diterima, gunakan injeksi `PasswordEncoder` untuk verifikasi password. **Satu kali query** `findByEmail` untuk validasi dan pembuatan token.
   - Pencetakan JWT menggunakan `JwtService` dengan algoritma HS256.
   - Implementasikan **Refresh Token Rotation** dan deteksi pencurian token.
2. **OrderService (Checkout Logic)**
   - Rencana Kalkulasi: Sistem harus sanggup mengambil relasi harga original dari entitas bersangkutan -> Mengecek apakah `DiscountID` disertakan -> Mengkondisikan apakah diskon `Percentage` (potongan persen) atau `Fixed` (potongan rupiah tunai) -> Men-simpan `TotalAmount` lalu `FinalAmount`.

### Fase 4.4: Controller Layer & DTO (*Data Transfer Object*)
- **Validasi Input**: Pintu gerbang API di `@RestController` harus diawali dari penerimaan objek JSON bernama `...RequestDTO.java` beserta anotasi stempel `@Valid` dan `@RequestBody`.
- Contoh RequestDTO wajib divalidasi: Atribut harga dipatenkan `@Min(1)`, email diuji dengan `@Email()`, password diuji dengan `@Size(min = 8)`.
- **Implementasi Jackson / Anti-Serialization Bug**: Setiap metode POST/GET yang diekspos balik ke browser tidak boleh mereturn entitas (*Data layer*). Buat dan mapping return value hanya kepada kelas khusus `...ResponseDTO.java`. Khususnya pada `CustomOrderController`, mengembalikan Model Proxy JPA asli dapat memicu API _Crash (500 Error)_ pada Jackson parser.

### Fase 4.5: Global Exception Handler
- Integrasikan `@RestControllerAdvice` khusus menanggapi letusan eror Runtime atau SQLException.
- Tambahkan handler spesifik untuk exception autentikasi: `BadCredentialsException`, `ExpiredJwtException`, `SignatureException`.
- Rencana mitigasi: Tangkap seluruh generalisasi tipe logik *Exception*. Override message internal milik database (untuk menyembunyikan konfigurasi yang terpampang atau trace sql) menjadi balasan ber-struktur standar berupa JSON bersih (cth: kode 500, message *"Terjadi kegagalan pemrosesan sistem"*). Sisi stack trace hanya boleh "dibaca" di lokal log konsol developer melalui SLF4J logger.

---

## 5. Endpoint API Summary

### 5.1 Authentication Endpoints (Publik)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrasi user baru | ❌ |
| `POST` | `/api/auth/login` | Login & dapatkan token | ❌ |
| `POST` | `/api/auth/refresh` | Perbarui Access Token | ❌ (Butuh Refresh Token) |
| `POST` | `/api/auth/logout` | Invalidasi token | ✅ Bearer Token |

### 5.2 Protected Endpoints

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/products` | Lihat katalog produk | ✅ CUSTOMER / ADMIN |
| `POST` | `/api/products` | Tambah produk baru | ✅ ADMIN only |
| `POST` | `/api/orders` | Buat order / checkout | ✅ CUSTOMER |
| `GET` | `/api/orders/{id}` | Detail order | ✅ Owner / ADMIN |
| `POST` | `/api/custom-orders` | Buat custom order | ✅ CUSTOMER |
| `GET` | `/api/admin/**` | Admin dashboard | ✅ ADMIN only |

---

## 6. Redis — Mengapa Digunakan & Arsitektur Token Blacklist

Bagian ini menjelaskan secara mendalam **mengapa** Redis digunakan dalam sistem ini, **masalah** apa yang dipecahkan, dan **bagaimana** flow integrasinya dengan JWT authentication.

---

### 6.1 Masalah: JWT Tidak Bisa "Dihapus"

JWT secara desain adalah **stateless** — artinya server tidak menyimpan informasi tentang token yang sudah diterbitkan. Token valid selama:
1. Signature cocok (belum dimanipulasi)
2. Belum kadaluarsa (`exp` > waktu sekarang)

**Ini menciptakan masalah keamanan kritis:**

```
❌ MASALAH: Access Token Masih Berlaku Setelah Logout

   Waktu  |  Kejadian
   ───────┼──────────────────────────────────────────────────
   10:00  |  User login → dapat Access Token (berlaku 15 menit, exp=10:15)
   10:05  |  User logout → server menerima request logout
   10:06  |  ⚠️ Access Token MASIH VALID sampai 10:15!
          |  Jika token dicuri sebelum logout, penyerang masih bisa
          |  mengakses API selama 9 menit sisa!
   10:15  |  Baru kadaluarsa secara natural

   Tanpa blacklist, server TIDAK BISA membedakan:
   - Token milik user yang sudah logout
   - Token milik user yang masih aktif
   Karena keduanya memiliki signature valid dan belum expired.
```

**Solusi yang dibutuhkan**: Mekanisme untuk **mengingat** token mana yang sudah di-invalidasi (blacklist), sehingga meskipun signature valid dan belum expired, server tetap menolak token tersebut.

---

### 6.2 Mengapa Redis? (Bukan Database Biasa)

Pertanyaan logis: *"Kenapa tidak simpan blacklist di tabel SQL Server saja?"*

#### Perbandingan Opsi Penyimpanan Blacklist

| Kriteria | SQL Server (Database) | In-Memory Java (`HashMap`) | **Redis** |
|---|---|---|---|
| **Kecepatan baca** | ~5-20ms (disk I/O + network) | ~0.001ms (instant) | **~0.1-1ms** (network only) |
| **Skala multi-instance** | ✅ Shared antar instance | ❌ Tiap instance punya blacklist sendiri | **✅ Shared antar instance** |
| **Selamat saat restart** | ✅ Persisten | ❌ Hilang saat restart | **✅ Opsional persisten** |
| **Auto-cleanup expired** | ❌ Butuh scheduled job | ❌ Harus manual | **✅ TTL otomatis** |
| **Dampak ke DB utama** | ❌ Menambah beban query | ✅ Tidak ada | **✅ Tidak ada** |
| **Cocok untuk use case ini** | ⚠️ Berlebihan | ⚠️ Hanya untuk 1 server | **✅ Ideal** |

#### Mengapa Setiap Opsi Lain Bermasalah

**❌ SQL Server — Terlalu Lambat & Membebani**
```
 Setiap request API → JWT Filter → Query ke SQL Server "Apakah token ini di-blacklist?"
                                    ↓
                        SELECT * FROM BlacklistedTokens WHERE token = ?
                                    ↓
                        Disk I/O + Index Scan + Network Round-trip
                        = Tambahan ~5-20ms per request!

 Jika ada 1000 request/detik:
   → 1000 query tambahan per detik ke database utama
   → Database yang seharusnya melayani order & produk jadi lambat
```

**❌ In-Memory HashMap — Tidak Scalable**
```
 Skenario: 2 instance server (load balanced)

   Server A                    Server B
   ┌────────────────┐          ┌────────────────┐
   │ blacklist = {   │          │ blacklist = {   │
   │   "tokenXYZ"    │          │   (kosong!)     │
   │ }               │          │ }               │
   └────────────────┘          └────────────────┘

   User logout di Server A → token "XYZ" masuk blacklist Server A
   Request berikutnya masuk ke Server B → token "XYZ" TIDAK ada di blacklist!
   → TOKEN MASIH DITERIMA! ❌

   Juga: jika Server A restart, seluruh blacklist HILANG.
```

**✅ Redis — Solusi yang Tepat**
```
   Server A ──┐
              ├──→ Redis (shared) ──→ blacklist = {"tokenXYZ": TTL 9 menit}
   Server B ──┘

   ✅ Semua instance mengakses blacklist yang SAMA
   ✅ Kecepatan ~0.1-1ms (in-memory, tanpa disk I/O)
   ✅ TTL otomatis → entry "tokenXYZ" OTOMATIS dihapus setelah 9 menit
   ✅ Tidak membebani SQL Server utama
   ✅ Selamat dari restart (opsional persistence)
```

---

### 6.3 Apa itu Redis?

Redis (**RE**mote **DI**ctionary **S**erver) adalah **in-memory data store** yang menyimpan data sepenuhnya di RAM, sehingga operasi baca/tulis sangat cepat.

```
┌───────────────────────────────────────────────────────────┐
│                        REDIS                               │
│                                                            │
│   Tipe Data:                                               │
│   ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐     │
│   │ String  │  │  Hash    │  │  List  │  │   Set    │     │
│   │ key:val │  │ key:map  │  │ key:[] │  │ key:{}   │     │
│   └─────────┘  └──────────┘  └────────┘  └──────────┘     │
│                                                            │
│   Fitur Kunci untuk Kasus Ini:                             │
│   ✅ SET key value EX seconds → simpan dengan auto-expiry  │
│   ✅ GET key → baca data (~0.1ms)                          │
│   ✅ EXISTS key → cek keberadaan key                       │
│   ✅ TTL key → cek sisa waktu hidup                        │
│   ✅ DEL key → hapus manual                                │
│                                                            │
│   Cara Kerja:                                              │
│   Data disimpan di RAM → Kecepatan seperti variabel lokal  │
│   TTL → Redis OTOMATIS menghapus entry yang sudah expired  │
│         Tidak butuh cron job atau scheduled task!           │
└───────────────────────────────────────────────────────────┘
```

| Properti | Nilai |
|---|---|
| **Port default** | `6379` |
| **Protocol** | TCP (RESP protocol) |
| **Latensi tipikal** | 0.1 — 1 ms |
| **Throughput** | ~100,000 operasi/detik (single thread) |
| **Persistence** | Opsional (RDB snapshot / AOF log) |
| **Spring Boot Integration** | `spring-boot-starter-data-redis` |

---

### 6.4 Arsitektur Redis dalam Sistem

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ARSITEKTUR SISTEM DENGAN REDIS                     │
│                                                                      │
│   ┌──────────┐     ┌──────────────────────────────────┐              │
│   │  Client  │────→│  Spring Boot Application          │              │
│   │ (Browser)│     │                                    │              │
│   └──────────┘     │  ┌──────────────────────────────┐ │   ┌───────┐ │
│                    │  │ JwtAuthenticationFilter       │─┼──→│ Redis │ │
│                    │  │ (cek blacklist setiap request)│ │   │ :6379 │ │
│                    │  └──────────────────────────────┘ │   └───────┘ │
│                    │                                    │       ↑     │
│                    │  ┌──────────────────────────────┐ │       │     │
│                    │  │ AuthService                   │─┼───────┘     │
│                    │  │ (blacklist token saat logout) │ │             │
│                    │  └──────────────────────────────┘ │             │
│                    │                                    │             │
│                    │  ┌──────────────────────────────┐ │  ┌────────┐ │
│                    │  │ OrderService, ProductService  │─┼─→│SQL Srvr│ │
│                    │  │ (data bisnis)                 │ │  │  :1433 │ │
│                    │  └──────────────────────────────┘ │  └────────┘ │
│                    └──────────────────────────────────┘              │
│                                                                      │
│   📌 Redis HANYA digunakan untuk:                                    │
│      1. JWT Access Token blacklist (saat logout)                     │
│      2. Rate limiting counter (login attempts per IP)                │
│                                                                      │
│   📌 SQL Server digunakan untuk:                                     │
│      1. Data bisnis (Users, Products, Orders, dll)                   │
│      2. Refresh Token storage (tabel RefreshTokens)                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Pemisahan tanggung jawab yang jelas:**
- **Redis** = data sementara yang butuh kecepatan tinggi (blacklist, rate limit)
- **SQL Server** = data persisten yang butuh integritas relasional (users, orders, products)

---

### 6.5 Flow Detail: Logout dengan Redis Blacklist

```
┌──────────┐                  ┌──────────────┐          ┌───────┐       ┌──────────┐
│  Client  │                  │ AuthService  │          │ Redis │       │ Database │
└─────┬────┘                  └──────┬───────┘          └───┬───┘       └────┬─────┘
      │                              │                     │                │
      │  POST /api/auth/logout       │                     │                │
      │  Header: Bearer eyJabc...    │                     │                │
      │  Body: {refreshToken:"eyJ"}  │                     │                │
      │─────────────────────────────→│                     │                │
      │                              │                     │                │
      │                  ┌───────────┴───────────┐         │                │
      │                  │ 1. Ekstrak Access Token│         │                │
      │                  │    dari header          │         │                │
      │                  │ 2. Hitung sisa waktu:   │         │                │
      │                  │    exp - now = 540 detik │         │                │
      │                  │    (9 menit tersisa)     │         │                │
      │                  └───────────┬───────────┘         │                │
      │                              │                     │                │
      │                              │  SET blacklist:     │                │
      │                              │  eyJabc... "logged_out"              │
      │                              │  EX 540             │                │
      │                              │  (auto-hapus 540s)  │                │
      │                              │────────────────────→│                │
      │                              │                     │                │
      │                              │  OK ✓               │                │
      │                              │←────────────────────│                │
      │                              │                     │                │
      │                              │  UPDATE RefreshTokens                │
      │                              │  SET Revoked = 1                    │
      │                              │  WHERE Token = ?                    │
      │                              │─────────────────────────────────────→│
      │                              │                     │                │
      │  HTTP 200 OK                 │                     │                │
      │  {"message":"Logout"}       │                     │                │
      │←─────────────────────────────│                     │                │
      │                              │                     │                │
 ═════╪══════════════════════════════╪════════ 5 menit kemudian ════════════╪═══
      │                              │                     │                │
      │  GET /api/products           │                     │                │
      │  Header: Bearer eyJabc...    │                     │                │
      │  (token yang SAMA!)          │                     │                │
      │─────────────────────────────→│                     │                │
      │                              │                     │                │
      │                  ┌───────────┴───────────┐         │                │
      │                  │ JwtAuthFilter:         │         │                │
      │                  │ 1. Signature valid ✓   │         │                │
      │                  │ 2. Belum expired ✓     │         │                │
      │                  │ 3. Cek blacklist Redis │         │                │
      │                  └───────────┬───────────┘         │                │
      │                              │                     │                │
      │                              │  EXISTS blacklist:  │                │
      │                              │  eyJabc...          │                │
      │                              │────────────────────→│                │
      │                              │                     │                │
      │                              │  1 (ADA! = BLOCKED) │                │
      │                              │←────────────────────│                │
      │                              │                     │                │
      │  HTTP 401 Unauthorized       │                     │                │
      │  {"error":"Token revoked"}  │                     │                │
      │←─────────────────────────────│                     │                │
      │                              │                     │                │
 ═════╪══════════════════════════════╪════════ 4 menit kemudian ════════════╪═══
      │                              │                     │                │
      │                              │  (TTL = 0)          │                │
      │                              │  Redis OTOMATIS     │                │
      │                              │  menghapus entry    │                │
      │                              │  "eyJabc..."        │                │
      │                              │  → Memori bersih!   │                │
      │                              │                     │                │
```

**Penjelasan langkah-langkah:**

| Step | Aksi | Detail |
|---|---|---|
| **1** | Client logout | Mengirim Access Token di header + Refresh Token di body |
| **2** | Hitung TTL | `TTL = token.exp - System.currentTimeMillis()` → sisa waktu hidup token |
| **3** | Simpan ke Redis | `SET "blacklist:{token}" "logged_out" EX {TTL}` |
| **4** | Revoke Refresh Token | Update database: `Revoked = 1` di tabel RefreshTokens |
| **5** | Request berikutnya | JwtAuthFilter cek Redis: `EXISTS "blacklist:{token}"` |
| **6** | Token ditolak | Redis return `1` (ada) → Filter menolak dengan `401` |
| **7** | Auto-cleanup | Setelah TTL habis, Redis otomatis hapus entry → hemat memori |

> **💡 Kunci**: TTL di Redis di-set **sama dengan sisa waktu hidup token**, bukan waktu tetap. Ketika token sudah kadaluarsa secara natural, tidak perlu lagi ada di blacklist karena sudah pasti ditolak oleh validasi `exp`. Redis menghapusnya otomatis.

---

### 6.6 Flow Detail: Setiap Request API (dengan Pengecekan Redis)

```
┌──────────┐          ┌───────────────────┐         ┌───────┐       ┌────────────┐
│  Client  │          │ JwtAuthFilter     │         │ Redis │       │ Controller │
└─────┬────┘          └────────┬──────────┘         └───┬───┘       └─────┬──────┘
      │                        │                       │                  │
      │  GET /api/orders/42    │                       │                  │
      │  Bearer eyJxyz...      │                       │                  │
      │───────────────────────→│                       │                  │
      │                        │                       │                  │
      │            ┌───────────┴──────────────┐        │                  │
      │            │ STEP 1: Cek Signature    │        │                  │
      │            │ HMAC-SHA256 verify       │        │                  │
      │            │ → Valid ✓                │        │                  │
      │            ├──────────────────────────┤        │                  │
      │            │ STEP 2: Cek Expiration   │        │                  │
      │            │ exp > now?               │        │                  │
      │            │ → Belum expired ✓        │        │                  │
      │            └───────────┬──────────────┘        │                  │
      │                        │                       │                  │
      │                        │  STEP 3: Cek Blacklist│                  │
      │                        │  EXISTS blacklist:    │                  │
      │                        │  eyJxyz...            │                  │
      │                        │──────────────────────→│                  │
      │                        │                       │                  │
      │                        │  0 (TIDAK ADA)        │                  │
      │                        │  → Token bersih ✓     │                  │
      │                        │←──────────────────────│                  │
      │                        │                       │                  │
      │            ┌───────────┴──────────────┐        │                  │
      │            │ STEP 4: Set Security     │        │                  │
      │            │ Context (auth object)    │        │                  │
      │            └───────────┬──────────────┘        │                  │
      │                        │                       │                  │
      │                        │  filterChain.doFilter()──────────────────→
      │                        │                       │                  │
      │  HTTP 200 OK           │                       │                  │
      │  [{order data}]        │                       │                  │
      │←──────────────────────────────────────────────────────────────────│
```

**Urutan validasi JWT (3 layer):**
1. ✅ **Signature** — Apakah token belum dimanipulasi? (library jjwt)
2. ✅ **Expiration** — Apakah token belum kadaluarsa? (library jjwt)
3. ✅ **Blacklist** — Apakah token sudah di-logout? (**Redis**)

> Jika salah satu layer gagal, request langsung ditolak dengan `401 Unauthorized`. Layer dieksekusi berurutan untuk efisiensi — Signature dan Expiration dicek terlebih dahulu (tanpa network call) sebelum mengecek Redis (membutuhkan network call).

---

### 6.7 Implementasi Kode

#### 📁 Struktur File Redis

```
src/main/java/com/otaku/ecommerce/
├── config/
│   └── RedisConfig.java              // Konfigurasi koneksi & serializer
├── security/
│   ├── TokenBlacklistService.java    // Service blacklist token
│   └── JwtAuthenticationFilter.java  // Filter + pengecekan blacklist
└── auth/
    └── AuthService.java              // Logout → blacklist token
```

#### ⚙️ RedisConfig.java — Konfigurasi Koneksi

```java
@Configuration
@EnableCaching  // Mengaktifkan fitur cache Spring (opsional untuk use case lain)
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        // Gunakan String serializer (bukan default Java serializer)
        // ⚠️ PENTING: Default Java serializer membuat key tidak bisa dibaca di Redis CLI
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());

        template.afterPropertiesSet();
        return template;
    }
}
```

**Mengapa perlu konfigurasi serializer?**
```
❌ Default Java Serializer:
   Key di Redis: "\xac\xed\x00\x05t\x00\x15blacklist:eyJabc..."
   → Tidak bisa dibaca di Redis CLI, tidak bisa di-debug

✅ String Serializer:
   Key di Redis: "blacklist:eyJabc..."
   → Bersih, bisa dibaca, bisa di-debug di Redis CLI
```

#### 🛑 TokenBlacklistService.java — Core Blacklist Logic

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String BLACKLIST_PREFIX = "blacklist:";

    /**
     * Menambahkan Access Token ke blacklist Redis.
     * Token akan OTOMATIS dihapus oleh Redis setelah TTL habis.
     *
     * @param token     JWT Access Token yang akan di-blacklist
     * @param expiration Waktu kadaluarsa token (dari claims 'exp')
     */
    public void blacklistToken(String token, Date expiration) {
        // Hitung sisa waktu hidup token
        long ttlMillis = expiration.getTime() - System.currentTimeMillis();

        if (ttlMillis <= 0) {
            // Token sudah expired → tidak perlu di-blacklist
            log.debug("Token sudah expired, skip blacklist");
            return;
        }

        String key = BLACKLIST_PREFIX + token;
        long ttlSeconds = ttlMillis / 1000;

        // SET key value EX ttlSeconds
        // → Simpan entry dengan auto-expiry
        redisTemplate.opsForValue().set(key, "logged_out", ttlSeconds, TimeUnit.SECONDS);

        log.info("Token di-blacklist, TTL={} detik", ttlSeconds);
    }

    /**
     * Mengecek apakah sebuah token ada di blacklist.
     * Dipanggil oleh JwtAuthenticationFilter di SETIAP request.
     *
     * @param token JWT Access Token yang akan dicek
     * @return true jika token di-blacklist (ditolak), false jika bersih (diterima)
     */
    public boolean isBlacklisted(String token) {
        String key = BLACKLIST_PREFIX + token;
        Boolean exists = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(exists);
    }

    /**
     * Blacklist SEMUA token milik satu user (force logout).
     * Digunakan saat deteksi pencurian token atau admin force-logout.
     *
     * @param userId ID user yang akan di-force-logout
     */
    public void blacklistAllUserTokens(Long userId) {
        String key = "user_force_logout:" + userId;
        // Simpan timestamp force logout, berlaku 24 jam
        redisTemplate.opsForValue().set(key,
            String.valueOf(System.currentTimeMillis()),
            24, TimeUnit.HOURS);

        log.warn("Force logout user ID={}", userId);
    }

    /**
     * Cek apakah user di-force-logout setelah token diterbitkan.
     */
    public boolean isUserForceLoggedOut(Long userId, Date tokenIssuedAt) {
        String key = "user_force_logout:" + userId;
        String logoutTimestamp = redisTemplate.opsForValue().get(key);

        if (logoutTimestamp == null) return false;

        long logoutTime = Long.parseLong(logoutTimestamp);
        return tokenIssuedAt.getTime() < logoutTime;
        // Token diterbitkan SEBELUM force logout → ditolak
    }
}
```

#### 🛡️ JwtAuthenticationFilter.java — Dengan Pengecekan Redis

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenBlacklistService blacklistService;  // ⬅️ Inject Redis service

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain)
                                     throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        // STEP 1 & 2: Validasi signature + expiration (library jjwt)
        if (!jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);  // Token invalid → lanjut tanpa auth
            return;
        }

        // ⬇️ STEP 3: Cek blacklist di Redis ⬇️
        if (blacklistService.isBlacklisted(token)) {
            // Token ada di blacklist → TOLAK meskipun signature & expiry valid
            log.warn("Blocked blacklisted token from IP: {}", request.getRemoteAddr());
            filterChain.doFilter(request, response);  // Lanjut tanpa auth → 401
            return;
        }

        // STEP 4: Cek force logout per user
        Claims claims = jwtService.extractAllClaims(token);
        Long userId = claims.get("userId", Long.class);
        if (blacklistService.isUserForceLoggedOut(userId, claims.getIssuedAt())) {
            log.warn("Blocked force-logged-out user token, userId={}", userId);
            filterChain.doFilter(request, response);
            return;
        }

        // STEP 5: Semua validasi lolos → set SecurityContext
        String email = claims.getSubject();
        String role = claims.get("role", String.class);

        UsernamePasswordAuthenticationToken authToken =
            new UsernamePasswordAuthenticationToken(
                email, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
        authToken.setDetails(
            new WebAuthenticationDetailsSource().buildDetails(request)
        );
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }
}
```

#### 🔴 AuthService.java — Logout dengan Redis

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final JwtService jwtService;
    private final TokenBlacklistService blacklistService;
    private final RefreshTokenRepository refreshTokenRepository;

    public void logout(String accessToken, String refreshToken) {

        // 1. Blacklist Access Token di Redis
        if (jwtService.isTokenValid(accessToken)) {
            Claims claims = jwtService.extractAllClaims(accessToken);
            blacklistService.blacklistToken(accessToken, claims.getExpiration());
            // ↑ token disimpan di Redis dengan TTL = sisa waktu expiry
        }

        // 2. Revoke Refresh Token di Database
        refreshTokenRepository.findByToken(refreshToken)
            .ifPresent(rt -> {
                rt.setRevoked(true);   // Tandai sebagai di-revoke
                refreshTokenRepository.save(rt);
            });

        log.info("User logged out successfully");
    }

    /**
     * Force logout — saat admin memaksa user keluar
     * atau saat deteksi pencurian refresh token
     */
    public void forceLogoutUser(Long userId) {
        // 1. Blacklist semua token di Redis
        blacklistService.blacklistAllUserTokens(userId);

        // 2. Revoke semua refresh token di database
        refreshTokenRepository.revokeAllByUserId(userId);

        log.warn("Force logout executed for userId={}", userId);
    }
}
```

---

### 6.8 Konfigurasi `application.yml` — Redis

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}     # Default: localhost untuk development
      port: ${REDIS_PORT:6379}          # Default: 6379
      password: ${REDIS_PASSWORD:}      # Kosong untuk development, WAJIB isi di production
      timeout: 2000ms                   # Timeout koneksi: 2 detik
      lettuce:                          # Lettuce = Redis client bawaan Spring Boot
        pool:
          max-active: 10                # Maksimal 10 koneksi aktif bersamaan
          max-idle: 5                   # Maksimal 5 koneksi idle
          min-idle: 1                   # Minimal 1 koneksi selalu siap
          max-wait: 1000ms              # Tunggu maks 1 detik jika pool penuh
```

**Penjelasan konfigurasi:**

| Property | Nilai | Alasan |
|---|---|---|
| `host` | Dari ENV variable | Tidak hardcode → fleksibel untuk dev/staging/prod |
| `password` | Dari ENV variable | **WAJIB** di production, Redis tanpa password = bahaya |
| `timeout` | 2 detik | Jika Redis tidak merespon dalam 2 detik, gagalkan → fallback |
| `max-active: 10` | 10 koneksi | Cukup untuk ~1000 request/detik per instance |
| `lettuce` | Default client | Spring Boot 3.x menggunakan Lettuce (non-blocking, thread-safe) |

---

### 6.9 Menjalankan Redis

#### Development (Lokal)

**Opsi A: Docker (Direkomendasikan)**
```bash
# Jalankan Redis container
docker run -d --name redis-otaku \
  -p 6379:6379 \
  redis:7-alpine

# Verifikasi Redis berjalan
docker exec -it redis-otaku redis-cli ping
# Output: PONG
```

**Opsi B: Windows (Via WSL atau Redis for Windows)**
```bash
# Via WSL (Windows Subsystem for Linux)
wsl
sudo apt update && sudo apt install redis-server
sudo service redis-server start
redis-cli ping
# Output: PONG
```

#### Production
```bash
# Docker Compose (bersama aplikasi Spring Boot)
# Lihat docker-compose.yml di bagian deployment
docker run -d --name redis-prod \
  -p 6379:6379 \
  --requirepass ${REDIS_PASSWORD} \
  redis:7-alpine \
  redis-server --appendonly yes    # Aktifkan persistence (AOF)
```

#### Monitoring & Debugging Redis
```bash
# Masuk ke Redis CLI
redis-cli

# Lihat semua key blacklist
KEYS blacklist:*

# Cek apakah token tertentu di-blacklist
EXISTS blacklist:eyJhbGciOiJIUzI1NiJ9...

# Cek sisa TTL (dalam detik)
TTL blacklist:eyJhbGciOiJIUzI1NiJ9...

# Lihat total memori yang dipakai
INFO memory

# Hapus semua data (HANYA development!)
FLUSHDB
```

---

### 6.10 Estimasi Penggunaan Memori Redis

| Skenario | Perhitungan | Memori |
|---|---|---|
| 1 token di-blacklist | ~500 byte (key) + ~20 byte (value) + overhead | ~600 byte |
| 100 user logout bersamaan | 100 × 600 byte | **~60 KB** |
| 10,000 user logout bersamaan | 10,000 × 600 byte | **~6 MB** |
| 100,000 user logout bersamaan | 100,000 × 600 byte | **~60 MB** |

> **Kesimpulan**: Bahkan dengan 100.000 token di-blacklist secara bersamaan, Redis hanya menggunakan ~60 MB RAM. Ini sangat ringan — Redis default bisa menangani hingga beberapa GB data.

> **Keuntungan TTL**: Entry otomatis dihapus setelah token expired, sehingga penggunaan memori **tidak pernah tumbuh tanpa batas**.

---

### 6.11 Strategi Fallback: Jika Redis Down

Apa yang terjadi jika Redis mati atau tidak bisa dihubungi?

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;

    public boolean isBlacklisted(String token) {
        try {
            String key = "blacklist:" + token;
            Boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (RedisConnectionFailureException e) {
            // ⚠️ KEPUTUSAN DESAIN: Fail-open vs Fail-closed

            // OPSI A: Fail-open (izinkan request)
            // → User experience lebih baik, tapi token yang sudah logout bisa lolos
            log.error("Redis down! Fail-open: mengizinkan request. Error: {}", e.getMessage());
            return false;

            // OPSI B: Fail-closed (tolak semua request) — LEBIH AMAN
            // → Keamanan lebih tinggi, tapi semua user terblokir saat Redis down
            // log.error("Redis down! Fail-closed: menolak request");
            // throw new ServiceUnavailableException("Layanan sedang maintenance");
        }
    }
}
```

**Rekomendasi**: Gunakan **Fail-open** untuk development dan **Fail-closed** untuk production yang memiliki Redis dengan high-availability (Redis Sentinel atau Redis Cluster).

| Strategi | Keamanan | User Experience | Kapan Digunakan |
|---|---|---|---|
| **Fail-open** | ⚠️ Risiko: token logout bisa lolos | ✅ User tetap bisa akses | Development, non-critical |
| **Fail-closed** | ✅ Aman: semua request ditolak | ❌ Semua user terblokir | Production + Redis HA |

---

### 6.12 Ringkasan: Kapan Redis Terlibat dalam Flow

| Flow | Redis Digunakan? | Aksi Redis |
|---|---|---|
| **Register** | ❌ | — |
| **Login** | ❌ | — |
| **Setiap Request API** | ✅ **READ** | `EXISTS blacklist:{token}` → cek apakah token sudah logout |
| **Refresh Token** | ❌ | — (refresh token dicek di database) |
| **Logout** | ✅ **WRITE** | `SET blacklist:{token} EX {ttl}` → simpan token ke blacklist |
| **Force Logout** | ✅ **WRITE** | `SET user_force_logout:{userId}` → blokir semua token user |
| **Rate Limiting** | ✅ **READ+WRITE** | `INCR rate:{ip}` → hitung percobaan login per IP |

---

## 7. Keamanan Berbasis OWASP Top 10 (2021 Edition)

Bagian ini memetakan risiko keamanan berdasarkan [OWASP Top 10 — 2021](https://owasp.org/Top10/) dan menjelaskan langkah mitigasi konkret yang diterapkan pada arsitektur sistem Otaku E-Commerce menggunakan Spring Boot.

> **Referensi**: OWASP (Open Worldwide Application Security Project) adalah standar industri internasional untuk keamanan aplikasi web. Setiap kategori risiko diberi kode **A01–A10** berdasarkan tingkat keparahan dan frekuensi kemunculan.

---

### 6.1 A01:2021 — Broken Access Control ⚠️ (Risiko #1)

**Deskripsi**: Kegagalan pembatasan aksi yang seharusnya hanya boleh dilakukan oleh user tertentu. Penyerang dapat mengakses, memodifikasi, atau menghapus data milik user lain.

#### Skenario Serangan pada Sistem Ini
```
❌ SERANGAN: Horizontal Privilege Escalation
   Customer A (UserID=42) mengubah URL dari:
   GET /api/orders/101  (milik dia)
   menjadi:
   GET /api/orders/102  (milik Customer B, UserID=55)
   → Jika tidak dicek, data order Customer B terekspos!

❌ SERANGAN: Vertical Privilege Escalation
   Customer biasa mengirim request ke endpoint admin:
   POST /api/products  (seharusnya hanya ADMIN)
   → Jika role tidak diverifikasi, customer bisa menambah produk!
```

#### Mitigasi & Implementasi

**1. Role-Based Access Control (RBAC) di SecurityConfig**
```java
// Sudah dikonfigurasi di SecurityConfig.java (Bagian 3.5)
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/admin/**").hasRole("ADMIN")       // Vertical control
    .requestMatchers(HttpMethod.POST, "/api/products").hasRole("ADMIN")
    .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
    .anyRequest().authenticated()
)
```

**2. Object-Level Authorization — Cek Kepemilikan Data**
```java
@Service
public class OrderService {

    public OrderResponseDTO getOrderById(Long orderId, String currentUserEmail) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order tidak ditemukan"));

        // ⚠️ OWASP A01: Cek kepemilikan — WAJIB sebelum return data
        if (!order.getUser().getEmail().equals(currentUserEmail)
            && !isAdmin(currentUserEmail)) {
            throw new AccessDeniedException("Anda tidak memiliki izin untuk melihat order ini");
        }

        return mapToResponseDTO(order);
    }
}
```

**3. Method-Level Security di Controller**
```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @orderSecurity.isOwner(#id, authentication.name)")
    public ResponseEntity<OrderResponseDTO> getOrder(@PathVariable Long id) {
        // Spring Security menolak sebelum masuk method jika tidak berhak
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")  // Hanya admin yang bisa hapus
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) { ... }
}
```

**4. Custom Security Evaluator Bean**
```java
@Component("orderSecurity")
public class OrderSecurityEvaluator {

    @Autowired
    private OrderRepository orderRepository;

    public boolean isOwner(Long orderId, String email) {
        return orderRepository.findById(orderId)
            .map(order -> order.getUser().getEmail().equals(email))
            .orElse(false);
    }
}
```

| Checklist A01 | Status |
|---|---|
| Role-based endpoint restriction di SecurityConfig | ✅ |
| Object-level ownership check di Service Layer | ✅ |
| `@PreAuthorize` di method sensitif | ✅ |
| Default deny (anyRequest().authenticated()) | ✅ |
| Tidak ada endpoint admin tanpa proteksi role | ✅ |

---

### 6.2 A02:2021 — Cryptographic Failures 🔐

**Deskripsi**: Kegagalan melindungi data sensitif baik saat transit (*in-transit*) maupun saat disimpan (*at-rest*), termasuk penggunaan algoritma kriptografi yang lemah atau implementasi yang salah.

#### Data Sensitif pada Sistem Ini

| Data | Klasifikasi | Proteksi |
|---|---|---|
| Password user | **SANGAT SENSITIF** | BCrypt hash (12 rounds), tidak pernah disimpan plaintext |
| JWT Secret Key | **SANGAT SENSITIF** | Environment Variable, ≥256-bit |
| Email user | **PII** | Tidak terekspos di log, di-mask di audit trail |
| Data order & pembayaran | **SENSITIF** | Hanya terekspos ke owner & admin |
| JWT Token | **SENSITIF** | Dikirim via HTTPS, berumur pendek |

#### Mitigasi & Implementasi

**1. Password — Hashing dengan BCrypt (Bukan Enkripsi!)**
```java
// ⚠️ SALAH — Jangan pernah lakukan ini:
user.setPassword(password);                          // Plaintext!
user.setPassword(Base64.encode(password));            // Encoding ≠ Hashing!
user.setPassword(MessageDigest.getInstance("MD5")...); // MD5 sudah tidak aman!
user.setPassword(MessageDigest.getInstance("SHA-256")...); // Tanpa salt = rentan rainbow table!

// ✅ BENAR — Gunakan BCrypt:
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
    // BCrypt otomatis menangani: salt generation + adaptive cost factor
}

// Saat registrasi:
user.setPasswordHash(passwordEncoder.encode(rawPassword));

// Saat login:
if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
    throw new BadCredentialsException("Email atau password salah");
}
```

**2. Proteksi Data Sensitif di Response — `@JsonIgnore`**
```java
@Entity
@Table(name = "Users")
public class User {

    @JsonIgnore  // ⚠️ OWASP A02: WAJIB — Jangan pernah sertakan di JSON response
    private String passwordHash;

    @JsonIgnore  // Jangan ekspos role internal jika menggunakan DTO
    private String role;
}
```

**3. HTTPS Enforcement di Production**
```yaml
# application-prod.yml
server:
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
  # Force redirect HTTP → HTTPS
  port: 443
```

**4. Security Headers via Spring Security**
```java
// Di SecurityConfig.java, tambahkan:
http.headers(headers -> headers
    .contentTypeOptions(ct -> {})            // X-Content-Type-Options: nosniff
    .frameOptions(fo -> fo.deny())           // X-Frame-Options: DENY
    .xssProtection(xss -> xss.disable())     // Modern: pakai CSP, bukan X-XSS-Protection
    .httpStrictTransportSecurity(hsts -> hsts
        .includeSubDomains(true)
        .maxAgeInSeconds(31536000)            // HSTS: 1 tahun
    )
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; frame-ancestors 'none'")
    )
);
```

| Checklist A02 | Status |
|---|---|
| Password di-hash dengan BCrypt (≥12 rounds) | ✅ |
| `@JsonIgnore` pada field sensitif | ✅ |
| JWT Secret ≥ 256-bit dari ENV variable | ✅ |
| HTTPS enforcement di production | ✅ |
| Security headers (HSTS, CSP, nosniff, etc.) | ✅ |
| Tidak ada data sensitif di log/console | ✅ |

---

### 6.3 A03:2021 — Injection 💉

**Deskripsi**: Input dari user yang tidak di-sanitasi dimasukkan langsung ke dalam query SQL, perintah OS, atau expression parser sehingga penyerang bisa mengeksekusi perintah berbahaya.

#### Skenario Serangan
```
❌ SERANGAN: SQL Injection
   Login request dengan email:
   {"email": "admin' OR '1'='1' --", "password": "apapun"}

   Jika query dibentuk via string concatenation:
   SELECT * FROM Users WHERE Email = 'admin' OR '1'='1' --' AND PasswordHash = '...'
   → Bypass autentikasi! Attacker login sebagai admin.

❌ SERANGAN: HQL/JPQL Injection
   Request search produk:
   GET /api/products?category=ActionFigure' OR '1'='1

   Jika query JPQL dibentuk via concatenation:
   FROM Product WHERE category = 'ActionFigure' OR '1'='1'
   → Seluruh produk terekspos!
```

#### Mitigasi & Implementasi

**1. Parameterized Queries — Spring Data JPA (Otomatis Aman)**
```java
// ✅ AMAN — Spring Data JPA menggunakan parameterized query secara otomatis
public interface UserRepository extends JpaRepository<User, Long> {

    // Method query — parameter otomatis di-bind dengan PreparedStatement
    Optional<User> findByEmail(String email);

    // JPQL dengan named parameter — aman dari injection
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.role = :role")
    Optional<User> findByEmailAndRole(@Param("email") String email,
                                       @Param("role") String role);
}
```

**2. HINDARI Native Query dengan String Concatenation**
```java
// ❌ SANGAT BERBAHAYA — Jangan pernah lakukan ini:
@Query(value = "SELECT * FROM Users WHERE Name LIKE '%" + name + "%'",
       nativeQuery = true)
List<User> searchByName(String name);

// ✅ AMAN — Gunakan parameter binding:
@Query(value = "SELECT * FROM Users WHERE Name LIKE %:name%",
       nativeQuery = true)
List<User> searchByName(@Param("name") String name);

// ✅ LEBIH AMAN — Gunakan Specification/Criteria API untuk dynamic query:
public class ProductSpecification {
    public static Specification<Product> hasCategory(String category) {
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    public static Specification<Product> nameLike(String name) {
        return (root, query, cb) -> cb.like(root.get("name"), "%" + name + "%");
    }
}
```

**3. Input Validation sebagai Pertahanan Berlapis**
```java
public class ProductSearchRequestDTO {

    @Pattern(regexp = "^[a-zA-Z0-9\\s]{1,50}$",
             message = "Nama hanya boleh alfanumerik, maksimal 50 karakter")
    private String searchName;

    @Pattern(regexp = "^(ActionFigure|Outfit|Accessories|Poster)$",
             message = "Kategori tidak valid")
    private String category;
}
```

| Checklist A03 | Status |
|---|---|
| Seluruh query menggunakan parameterized/prepared statement | ✅ |
| Tidak ada string concatenation di JPQL/SQL | ✅ |
| Input validation dengan `@Pattern`, `@Size`, `@Email` | ✅ |
| Menggunakan Spring Data JPA repository methods | ✅ |
| Dynamic queries menggunakan Specification API | ✅ |

---

### 6.4 A04:2021 — Insecure Design 📐

**Deskripsi**: Kelemahan fundamental di level arsitektur/desain yang tidak bisa diperbaiki hanya dengan implementasi yang sempurna. Diperlukan perencanaan keamanan sejak awal (*security by design*).

#### Prinsip Desain Aman yang Diterapkan

**1. Defense in Depth (Pertahanan Berlapis)**
```
Request → [HTTPS/TLS] → [Rate Limiter] → [CORS Filter] → [JWT Filter]
       → [SecurityConfig Auth] → [@PreAuthorize] → [Service Validation]
       → [DTO Sanitization] → [Parameterized Query] → Database
```
> Setiap layer memiliki mekanisme keamanan sendiri. Jika satu layer gagal, layer berikutnya tetap memproteksi.

**2. Principle of Least Privilege**
```java
// User CUSTOMER hanya bisa:
//   - Melihat produk (GET /api/products)
//   - Membuat order sendiri (POST /api/orders)
//   - Melihat order MILIKNYA (GET /api/orders/{id} — dengan ownership check)

// User ADMIN bisa:
//   - Semua hal di atas PLUS
//   - CRUD produk, melihat semua order, mengakses admin dashboard

// ⚠️ JANGAN buat role "SUPERADMIN" yang bisa mengakses SEMUANYA tanpa batasan
```

**3. Fail-Safe Defaults**
```java
// SecurityConfig: Default = DITOLAK, baru buka secara eksplisit
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()  // Eksplisit buka
    // ...endpoint lain yang dibuka eksplisit...
    .anyRequest().authenticated()                  // ⚠️ DEFAULT: TOLAK semua
)
```

**4. Separation of Concerns — DTO Pattern**
```
Client → Controller (DTO) → Service (Business Logic) → Repository (Entity) → DB
                ↓                       ↓
         RequestDTO               ResponseDTO
     (hanya field yang               (hanya field yang
      boleh dikirim client)            boleh dilihat client)

⚠️ Entity TIDAK PERNAH langsung terekspos ke client
```

**5. Threat Modeling — Matriks Ancaman Sistem**

| Aset | Ancaman | Dampak | Mitigasi |
|---|---|---|---|
| Password User | Brute-force, Rainbow Table | Akun diambil alih | BCrypt + Rate Limiting |
| JWT Token | Token theft via XSS/MITM | Akses ilegal | HTTPS + Short-lived + HttpOnly |
| Data Order | Horizontal privilege escalation | Kebocoran data finansial | Object-level authorization |
| Endpoint Admin | Vertical privilege escalation | Manipulasi produk/data | RBAC + `@PreAuthorize` |
| Database | SQL Injection | Data breach total | JPA parameterized queries |
| API | DDoS / Credential stuffing | Service down | Rate limiting + WAF |

---

### 6.5 A05:2021 — Security Misconfiguration ⚙️

**Deskripsi**: Konfigurasi keamanan yang salah, tidak lengkap, atau menggunakan default yang tidak aman. Termasuk membiarkan fitur debug aktif, penggunaan credential default, atau error message yang terlalu detail.

#### Mitigasi & Implementasi

**1. Profile-Based Configuration**
```yaml
# application.yml (shared)
spring:
  jpa:
    open-in-view: false     # ⚠️ OWASP: Matikan OSIV — mencegah lazy loading leak
    show-sql: false          # Jangan tampilkan SQL di production

---
# application-dev.yml (development only)
spring:
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: update       # Hanya di development!
  devtools:
    restart:
      enabled: true

---
# application-prod.yml (production)
spring:
  jpa:
    hibernate:
      ddl-auto: validate     # ⚠️ JANGAN 'create' atau 'update' di production!
    show-sql: false
  devtools:
    restart:
      enabled: false

server:
  error:
    include-stacktrace: never    # ⚠️ WAJIB: Jangan tampilkan stack trace
    include-message: never       # ⚠️ Sembunyikan pesan error internal
    include-binding-errors: never
```

**2. Dependency Security — `pom.xml`**
```xml
<!-- Pastikan menggunakan versi terbaru yang aman -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.x</version>  <!-- Selalu upgrade ke patch terbaru -->
</parent>

<!-- Plugin untuk mendeteksi vulnerability di dependency -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>10.x.x</version>
    <executions>
        <execution>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>  <!-- Gagalkan build jika ada CVE ≥ 7 -->
    </configuration>
</plugin>
```

**3. Actuator Security (Jika Digunakan)**
```yaml
# ⚠️ Spring Boot Actuator bisa mengekspos info internal!
management:
  endpoints:
    web:
      exposure:
        include: health,info      # Hanya expose yang diperlukan
        # JANGAN: include: "*"    # Ini mengekspos env, beans, mappings, dll!
  endpoint:
    health:
      show-details: never         # Jangan tampilkan detail DB connection, dll
```

| Checklist A05 | Status |
|---|---|
| Konfigurasi berbasis profile (dev/prod) | ✅ |
| `ddl-auto: validate` di production | ✅ |
| Stack trace disembunyikan (`include-stacktrace: never`) | ✅ |
| `open-in-view: false` | ✅ |
| Actuator endpoints dibatasi | ✅ |
| OWASP Dependency Check di build pipeline | ✅ |
| Default credential tidak ada (semua dari ENV) | ✅ |

---

### 6.6 A06:2021 — Vulnerable and Outdated Components 📦

**Deskripsi**: Menggunakan library, framework, atau komponen pihak ketiga yang memiliki kerentanan keamanan yang sudah diketahui (CVE).

#### Mitigasi

**1. Regular Dependency Audit**
```bash
# Jalankan OWASP Dependency Check (Maven)
mvn org.owasp:dependency-check-maven:check

# Atau gunakan Snyk (alternatif)
snyk test --all-projects
```

**2. Spring Boot BOM (Bill of Materials)**
```xml
<!-- Spring Boot Starter Parent secara otomatis mengelola versi dependency
     yang sudah di-patch untuk kerentanan yang diketahui -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.5</version>  <!-- Selalu gunakan versi stable terbaru -->
</parent>
```

**3. Jadwal Update Dependency**

| Komponen | Jadwal Review | Aksi |
|---|---|---|
| Spring Boot | Setiap rilis minor/patch | Upgrade + test |
| jjwt | Setiap rilis | Cek changelog untuk security fix |
| SQL Server JDBC Driver | Setiap rilis | Upgrade |
| Semua dependency | Bulanan | `mvn versions:display-dependency-updates` |

---

### 6.7 A07:2021 — Identification and Authentication Failures 🔓

**Deskripsi**: Kelemahan dalam proses identifikasi dan autentikasi pengguna, termasuk proteksi terhadap serangan brute-force, credential stuffing, dan session management yang lemah.

> **⚡ Catatan**: Sebagian besar mitigasi A07 sudah dibahas detail di **Bagian 3 (Arsitektur JWT)**. Bagian ini menambahkan aspek-aspek tambahan yang belum tercakup.

#### Mitigasi Tambahan

**1. Rate Limiting pada Authentication Endpoints**
```java
@Component
public class LoginRateLimiter {

    // Struktur: IP Address → [timestamps of attempts]
    private final Map<String, List<Instant>> attempts = new ConcurrentHashMap<>();

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    public void checkRateLimit(String ipAddress) {
        attempts.computeIfAbsent(ipAddress, k -> new CopyOnWriteArrayList<>());
        List<Instant> ipAttempts = attempts.get(ipAddress);

        // Hapus attempt yang sudah di luar window
        Instant cutoff = Instant.now().minus(WINDOW);
        ipAttempts.removeIf(t -> t.isBefore(cutoff));

        if (ipAttempts.size() >= MAX_ATTEMPTS) {
            throw new RateLimitExceededException(
                "Terlalu banyak percobaan login. Coba lagi dalam 1 menit."
            );
        }

        ipAttempts.add(Instant.now());
    }
}
```

**2. Password Policy Enforcement**
```java
public class RegisterRequestDTO {

    @NotBlank(message = "Email wajib diisi")
    @Email(message = "Format email tidak valid")
    private String email;

    @NotBlank(message = "Password wajib diisi")
    @Size(min = 8, max = 128, message = "Password harus 8-128 karakter")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
        message = "Password harus mengandung huruf besar, huruf kecil, angka, dan simbol"
    )
    private String password;

    @NotBlank(message = "Nama wajib diisi")
    @Size(min = 2, max = 100, message = "Nama harus 2-100 karakter")
    private String name;
}
```

**3. Account Lockout setelah Gagal Login Berulang**
```java
@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;

    public AuthResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadCredentialsException("Email atau password salah"));

        // ⚠️ OWASP A07: Cek apakah akun dikunci
        if (user.isAccountLocked()) {
            if (user.getLockExpiry().isAfter(LocalDateTime.now())) {
                throw new AccountLockedException(
                    "Akun dikunci sementara. Coba lagi setelah " + user.getLockExpiry()
                );
            }
            // Lock sudah expired → reset
            user.setFailedAttempts(0);
            user.setAccountLocked(false);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Tambah hitungan gagal
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            if (user.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setAccountLocked(true);
                user.setLockExpiry(LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);
            throw new BadCredentialsException("Email atau password salah");
        }

        // Login berhasil → reset counter
        user.setFailedAttempts(0);
        userRepository.save(user);

        // ... generate tokens ...
    }
}
```

| Checklist A07 | Status |
|---|---|
| Password hashing BCrypt ≥ 12 rounds | ✅ (Bagian 3) |
| Dual token strategy (Access + Refresh) | ✅ (Bagian 3) |
| Refresh Token Rotation | ✅ (Bagian 3) |
| Error message generik (anti user enumeration) | ✅ (Bagian 3) |
| Rate limiting pada login endpoint | ✅ |
| Password complexity policy | ✅ |
| Account lockout setelah gagal berulang | ✅ |

---

### 6.8 A08:2021 — Software and Data Integrity Failures 🧩

**Deskripsi**: Kegagalan menjamin integritas perangkat lunak dan data, termasuk penggunaan library dari sumber tidak terpercaya, CI/CD pipeline yang tidak aman, dan deserialization yang tidak aman.

#### Mitigasi & Implementasi

**1. JWT Signature Verification (Sudah Diterapkan)**
```java
// JwtService.java — Setiap token diverifikasi signaturenya
// Jika payload diubah tanpa signing key, verifikasi PASTI GAGAL
public Claims extractAllClaims(String token) {
    return Jwts.parser()
        .verifyWith(getSigningKey())   // ⚠️ Integrity check otomatis
        .build()
        .parseSignedClaims(token)
        .getPayload();
}
```

**2. Deserialization Safety — Jackson Configuration**
```java
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // ⚠️ OWASP A08: Larang deserialization tipe arbitrer
        mapper.deactivateDefaultTyping();

        // Tolak properti yang tidak dikenal (mencegah mass assignment)
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, true);

        // Jangan serialize null values
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        return mapper;
    }
}
```

**3. Mass Assignment Protection — DTO sebagai Shield**
```java
// ❌ BERBAHAYA: Jika menerima Entity langsung dari request body
// Attacker bisa mengirim: {"email":"a@b.com", "password":"x", "role":"ADMIN"}
// → Role di-set langsung ke ADMIN!

// ✅ AMAN: Gunakan DTO yang hanya menerima field yang diizinkan
public class RegisterRequestDTO {
    private String name;      // ✅ Boleh dari client
    private String email;     // ✅ Boleh dari client
    private String password;  // ✅ Boleh dari client
    // role → TIDAK ADA di DTO → server yang set default "CUSTOMER"
}
```

---

### 6.9 A09:2021 — Security Logging and Monitoring Failures 📊

**Deskripsi**: Kegagalan mencatat event keamanan penting dan memonitor aktivitas mencurigakan, sehingga serangan tidak terdeteksi atau tidak bisa di-forensik.

#### Implementasi Audit Logging

**1. Security Event Logger**
```java
@Component
@RequiredArgsConstructor
public class SecurityAuditLogger {

    private static final Logger auditLog = LoggerFactory.getLogger("SECURITY_AUDIT");

    public void logLoginSuccess(String email, String ipAddress) {
        auditLog.info("LOGIN_SUCCESS | email={} | ip={} | time={}",
            maskEmail(email), ipAddress, Instant.now());
    }

    public void logLoginFailure(String email, String ipAddress, String reason) {
        auditLog.warn("LOGIN_FAILURE | email={} | ip={} | reason={} | time={}",
            maskEmail(email), ipAddress, reason, Instant.now());
    }

    public void logAccessDenied(String email, String resource, String ipAddress) {
        auditLog.warn("ACCESS_DENIED | email={} | resource={} | ip={} | time={}",
            maskEmail(email), resource, ipAddress, Instant.now());
    }

    public void logTokenRefresh(String email, String ipAddress) {
        auditLog.info("TOKEN_REFRESH | email={} | ip={} | time={}",
            maskEmail(email), ipAddress, Instant.now());
    }

    public void logSuspiciousActivity(String email, String activity, String ipAddress) {
        auditLog.error("SUSPICIOUS | email={} | activity={} | ip={} | time={}",
            maskEmail(email), activity, ipAddress, Instant.now());
    }

    // ⚠️ OWASP A09: Jangan log data sensitif secara lengkap
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        return parts[0].charAt(0) + "***@" + parts[1];
    }
}
```

**2. Konfigurasi Logback untuk Audit Trail**
```xml
<!-- logback-spring.xml -->
<configuration>
    <!-- Audit log terpisah dari application log -->
    <appender name="SECURITY_AUDIT_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/security-audit.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/security-audit.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>90</maxHistory>  <!-- Simpan 90 hari untuk forensik -->
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} | %msg%n</pattern>
        </encoder>
    </appender>

    <logger name="SECURITY_AUDIT" level="INFO" additivity="false">
        <appender-ref ref="SECURITY_AUDIT_FILE" />
    </logger>
</configuration>
```

**3. Event yang WAJIB Di-log**

| Event | Level | Contoh |
|---|---|---|
| Login berhasil | `INFO` | `LOGIN_SUCCESS \| email=a***@email.com \| ip=...` |
| Login gagal | `WARN` | `LOGIN_FAILURE \| email=a***@email.com \| reason=bad_password` |
| Akses ditolak (403) | `WARN` | `ACCESS_DENIED \| email=a***@email.com \| resource=/api/admin` |
| Token refresh | `INFO` | `TOKEN_REFRESH \| email=a***@email.com` |
| Revoked token digunakan kembali | `ERROR` | `SUSPICIOUS \| activity=revoked_token_reuse` |
| Account locked | `WARN` | `ACCOUNT_LOCKED \| email=a***@email.com \| attempts=5` |
| Rate limit triggered | `WARN` | `RATE_LIMITED \| ip=192.168.1.x` |

**⚠️ Yang TIDAK BOLEH Ada di Log:**

| Data | Alasan |
|---|---|
| Password (plaintext/hash) | Jika log bocor, password terekspos |
| Full JWT token | Token bisa dicuri dari log |
| Full credit card number | PCI-DSS violation |
| Full email tanpa masking | GDPR/PII compliance |

---

### 6.10 A10:2021 — Server-Side Request Forgery (SSRF) 🌐

**Deskripsi**: Penyerang dapat membuat server mengirim request ke alamat internal yang seharusnya tidak bisa diakses dari luar, misalnya ke metadata cloud server, database internal, atau service internal.

#### Skenario Serangan pada Sistem Ini
```
❌ SERANGAN: SSRF via ImageReferenceURL
   POST /api/custom-orders
   Body: {
     "imageReferenceURL": "http://169.254.169.254/latest/meta-data/",  // AWS metadata!
     "serviceType": "AF_3D"
   }
   → Jika server fetch URL tersebut, attacker mendapat credential cloud!

❌ SERANGAN: SSRF via ImageURL
   POST /api/products  (oleh admin yang terkompromi)
   Body: {
     "imageURL": "http://localhost:8080/actuator/env",  // Internal endpoint!
   }
```

#### Mitigasi & Implementasi

**1. URL Validation & Whitelist**
```java
@Component
public class UrlValidator {

    // ⚠️ OWASP A10: Whitelist domain yang diizinkan
    private static final Set<String> ALLOWED_DOMAINS = Set.of(
        "cdn.otaku-shop.com",
        "images.otaku-shop.com",
        "storage.googleapis.com"
    );

    private static final Set<String> BLOCKED_IP_RANGES = Set.of(
        "127.", "10.", "172.16.", "172.17.", "172.18.", "172.19.",
        "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
        "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
        "192.168.", "169.254.", "0."
    );

    public boolean isUrlSafe(String url) {
        try {
            URI uri = new URI(url);
            String host = uri.getHost();

            // Hanya izinkan HTTPS
            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                return false;
            }

            // Cek apakah domain di whitelist
            if (!ALLOWED_DOMAINS.contains(host)) {
                return false;
            }

            // Resolve DNS dan cek IP (mencegah DNS rebinding)
            InetAddress address = InetAddress.getByName(host);
            String ip = address.getHostAddress();
            for (String blocked : BLOCKED_IP_RANGES) {
                if (ip.startsWith(blocked)) return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

**2. Validasi di Service Layer**
```java
@Service
public class CustomOrderService {

    @Autowired
    private UrlValidator urlValidator;

    public CustomOrderResponseDTO createOrder(CustomOrderRequestDTO dto, String userEmail) {
        // ⚠️ OWASP A10: Validasi URL sebelum menyimpan
        if (dto.getImageReferenceURL() != null
            && !urlValidator.isUrlSafe(dto.getImageReferenceURL())) {
            throw new InvalidInputException("URL gambar tidak valid atau tidak diizinkan");
        }
        // ... lanjutkan proses order ...
    }
}
```

---

### 6.11 Ringkasan Matrix Keamanan OWASP

Tabel berikut merangkum seluruh pemetaan risiko OWASP terhadap komponen sistem dan status implementasinya:

| OWASP ID | Risiko | Komponen Terdampak | Mitigasi Utama | Referensi Bagian |
|---|---|---|---|---|
| **A01** | Broken Access Control | OrderController, AdminController | RBAC + Object-level auth + `@PreAuthorize` | 6.1 |
| **A02** | Cryptographic Failures | User (password), JWT, HTTPS | BCrypt, `@JsonIgnore`, HSTS, TLS | 6.2 |
| **A03** | Injection | Repository, Search Query | JPA parameterized query, `@Pattern` validation | 6.3 |
| **A04** | Insecure Design | Arsitektur keseluruhan | Defense in depth, DTO pattern, threat modeling | 6.4 |
| **A05** | Security Misconfiguration | application.yml, Actuator | Profile-based config, dependency check | 6.5 |
| **A06** | Vulnerable Components | pom.xml (semua dependency) | OWASP Dependency Check, Spring Boot BOM | 6.6 |
| **A07** | Auth Failures | AuthService, LoginController | Rate limit, account lockout, password policy | 6.7 + Bagian 3 |
| **A08** | Data Integrity | JWT, Jackson, DTO | Signature verification, DTO shield | 6.8 |
| **A09** | Logging Failures | Seluruh sistem | SecurityAuditLogger, Logback file rotation | 6.9 |
| **A10** | SSRF | CustomOrder (imageURL) | URL whitelist, IP block, HTTPS-only | 6.10 |

---

## 8. Rangkuman Target Akhir Rencana

Dengan menerapkan tahapan dan implementasi arsitektur di atas, Developer akan mendapatkan *source code backend* yang:
1. Memiliki struktur data persis dengan diagram relasional perancangan awal.
2. **Sistem autentikasi JWT yang kokoh** dengan dual-token strategy, refresh token rotation, dan mekanisme revokasi.
3. **Redis sebagai lapisan keamanan tambahan** untuk JWT token blacklist, memastikan token yang sudah di-logout tidak bisa digunakan kembali meskipun belum kadaluarsa.
4. Bebas dari *Leak Data* (Seperti kebocoran array string sandi hash via JSON serialization).
5. Aman dari tembus ekspektasi trace sistem internal pada Postman/browser.
6. **Tahan terhadap serangan umum**: user enumeration, token theft, brute-force, CSRF, dan CORS abuse.
7. **Memenuhi standar keamanan OWASP Top 10 (2021)** dengan mitigasi menyeluruh pada setiap kategori risiko, termasuk: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Authentication Failures, Data Integrity, Logging & Monitoring, dan SSRF.
8. Performa solid berkat pemisahan _DTOs_, penekanan query efisien pada *Auth System*, Redis in-memory caching, dan stateless architecture.
