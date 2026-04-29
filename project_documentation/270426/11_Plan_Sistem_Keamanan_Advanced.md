# Plan: Sistem Keamanan Siber Lanjut (Advanced Cyber Security)

Dokumen ini merinci strategi mitigasi terhadap berbagai vektor serangan siber untuk memastikan integritas, kerahasiaan, dan ketersediaan sistem Otaku E-Commerce.

## 1. Mitigasi Serangan & Strategi Teknis

### A. Anti-Injection (SQL, XSS, NoSQL)
- **SQL Injection**: Memastikan penggunaan **Spring Data JPA** dengan *Prepared Statements*. Menghindari pembuatan query manual menggunakan string concatenation.
- **XSS (Cross-Site Scripting)**: Implementasi **Content Security Policy (CSP)** di sisi frontend. Menggunakan library sanitasi untuk input yang akan dirender kembali ke UI (misal: `DOMPurify`).
- **Input Validation (Regex & JSR-303)**: Menggunakan anotasi `@Valid` dan `@Pattern` (Regex) di setiap DTO. Regex digunakan untuk memastikan input hanya berisi karakter yang diizinkan (Whitelisting), misalnya:
    - **Email**: Regex standar RFC 5322.
    - **Username**: Alfanumerik (mencegah karakter aneh untuk injection).
    - **Password**: Regex kompleksitas (Minimal 1 besar, 1 kecil, 1 angka, 1 simbol).
    - **Phone**: Pola nomor telepon internasional yang valid.


### B. Anti-Bruteforce & Hit API (Spamming)
- **Rate Limiting**: Optimalisasi **Bucket4j** dan **Redis**. Membatasi jumlah request per IP per menit (misal: max 100 request/menit untuk API publik, 5 request/menit untuk login).
- **Account Lockout**: Implementasi logika penguncian akun sementara setelah 5 kali kegagalan login berturut-turut.
- **CAPTCHA**: Menambahkan Google reCAPTCHA v3 pada form Login dan Register untuk membedakan manusia dengan bot.

### C. Pencegahan Sniffing & Spoofing
- **Enkripsi Transit (SSL/TLS)**: Mewajibkan penggunaan HTTPS (TLS 1.3) di seluruh lingkungan produksi.
- **HSTS (HTTP Strict Transport Security)**: Memaksa browser untuk selalu berkomunikasi via HTTPS.
- **CSRF Protection**: Mengaktifkan perlindungan CSRF pada Spring Security (menggunakan CookieCsrfTokenRepository) untuk mencegah serangan spoofing request dari situs lain.
- **JWT Integrity**: Menggunakan algoritma enkripsi kuat (RS256 atau HS512) dengan rotasi secret key secara berkala.

### D. Keamanan Backdoor & Akses Ilegal
- **Zero Trust Architecture**: Setiap request harus divalidasi oleh `JwtAuthenticationFilter`. Tidak ada "pintu belakang" untuk admin; semua akses melalui jalur autentikasi resmi.
- **Environment Secrets**: Tidak menyimpan API Key atau Password dalam kode sumber. Menggunakan `.env` atau *Secret Manager* (seperti Vault atau AWS Secret Manager).
- **Dependency Scan**: Melakukan audit berkala terhadap library (Maven/NPM) untuk memastikan tidak ada celah keamanan bawaan (CVE).

## 2. Monitoring & Deteksi Dini
- **Log Management**: Menggunakan **ELK Stack** atau **Grafana Loki** untuk memantau aktivitas mencurigakan secara real-time.
- **Alerting System**: Mengirimkan notifikasi instan ke Admin (via Telegram/Email) jika terjadi lonjakan error 401/403 yang tidak wajar atau kegagalan login massal.

## 3. Alur Keamanan Request
1. **User Request** -> **WAF (Cloudflare)**: Filter awal serangan DDoS & Bot.
2. **Spring Security (Filter Chain)**: Cek Rate Limit -> Cek CSRF -> Cek JWT Token.
3. **Controller**: Validasi struktur data (JSR-303).
4. **Service**: Eksekusi logika bisnis dengan ownership check (IDOR Protection).
5. **Database**: Query aman via ORM.

---

## 4. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **Sertifikat SSL (Let's Encrypt)**: Untuk aktivasi HTTPS.
2. **Redis Server**: Untuk penyimpanan state rate limiting dan blacklist token.
3. **Google reCAPTCHA API Key**: Untuk integrasi bot protection di frontend.
4. **WAF Service (Misal: Cloudflare)**: Sebagai garda terdepan proteksi Hit API dan DDoS.
5. **Audit Security Tool**: Library seperti Snyk atau OWASP Dependency-Check.
