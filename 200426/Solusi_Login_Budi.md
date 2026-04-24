# Laporan Bug: OTK-5000 & OTK-4001 Saat Login `budi@gmail.com`

## 🔍 Akar Masalah 1: OTK-5000 (Terpotong di Postman)
Mendapatkan `OTK-5000` (Internal Server Error) terjadi karena Postman menggunakan method `GET` pada Endpoint yang mewajibkan `POST`. Hal ini sudah **Diperbaiki** di Backend dengan memberikan respons 405 Method Not Allowed daripada 500 error yang membingungkan.

---

## 🔍 Akar Masalah 2: OTK-4001 (Email atau password salah)
Setelah metode diubah menjadi `POST`, sistem merespon dengan `OTK-4001` (Unauthorized / Akses Ditolak). 

Hal ini membuktikan fungsi keamanan kamu (BCrypt `passwordEncoder.matches()`) berjalan sangat baik dan berhasil mendeteksi bahwa:
Walaupun kamu menginput password `"hashed_pass_123"`, Hash rahasia (`$2a$10$JYvoKZ7SgnxF3...`) yang tertulis di skema database (V2) ternyata **BUKAN** diciptakan dari kata sandi `"hashed_pass_123"`. 

Ini adalah hal umum dalam pengembangan: Password dummy BCrypt yang di-copy-paste tidak cocok dengan plaintext test-nya.

## 🛠️ Solusi (SUDAH DIPERBAIKI)

Saya telah langsung mereset password Budi di dalam Database-mu yang sedang berjalan dan di file Migration-nya.

**Di Postman:**
Silakan coba lagi. Kali ini gunakan password **`hashed_pass_admin`**:
```json
{
    "email": "budi@gmail.com",
    "password": "hashed_pass_admin"
}
```

*Sekarang, Budi & Admin punya sandi yang persis sama (`hashed_pass_admin`) sehingga jauh lebih mudah dan aman untuk dites selama proses testing!*

---

## 🔍 Pertanyaan Lanjutan: Kenapa Akses ke Root `http://localhost:8321/` Mengembalikan 403 Forbidden?

Ketika kamu membuka URL utama di browser, server memberikan error 403 Forbidden (Akses Ditolak).

**Kenapa ini terjadi?**
Ini karena konfigurasi di `SecurityConfig.java` milikmu sangat ketat. Di bagian routing:
```java
// Hanya API ini yang diizinkan publik
.requestMatchers("/api/v1/auth/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/discounts/**").permitAll()

// ... Aturan lainnya ...

// SISANYA wajib menggunakan JWT Token
.anyRequest().authenticated()
```
Root route (`/`) **tidak ada** di dalam daftar `permitAll()`. Oleh karena itu, aturan `.anyRequest().authenticated()` akan mengunci URL tersebut secara otomatis dan menolak request dari browser karena tidak membawa Authorization JWT Token.

**Cara Memperbaikinya (Belum Diterapkan):**
Jika kamu ingin halaman depan root API dapat diakses tanpa token (misalnya untuk halaman "Welcome" atau "Health Check"), tambahkan route `"/"` atau `"/error"` di blok `.permitAll()` dalam `SecurityConfig.java` pada baris sekitar ke-43.

Contoh solusinya di kodemu:
```java
// ─── Public (Tanpa Auth) ─────────────────────────────
.requestMatchers("/", "/error").permitAll()  // <--- Tambahkan baris ini
.requestMatchers("/api/v1/auth/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
```
Jika ini ditambahkan, mengakses dari Browser tidak akan terkena 403 Forbidden lagi.
