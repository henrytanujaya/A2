# Dokumentasi Komprehensif: Analisis 10 Poin Sistem E-Commerce Otaku

Dokumen ini membedah 10 poin penting dalam arsitektur backend, konfigurasi, dan alur operasional dari sistem E-Commerce Otaku. Setiap poin dijabarkan menggunakan format 5W (What, Why, Where, Who) dan 1H (How).

---

## 1. Dependency: Bucket4j (Rate Limiting)
**What (Apa):** Sebuah *library* Java (`bucket4j-core` versi 7.6.0) yang digunakan untuk mengimplementasikan algoritma Token Bucket.
**Why (Mengapa):** Berfungsi sebagai lapis perlindungan (DDoS Protection) terhadap serangan *Brute-Force* dan *Denial of Service*. Sistem akan menolak rentetan *request* yang abnormal dari satu alamat IP.
**Where (Di mana):** Dideklarasikan di dalam file `pom.xml` pada project backend.
**Who (Siapa):** Diimplementasikan oleh Developer, namun secara bisnis melindungi *System Administrator* dari beban server yang berlebihan dan *Customer* dari pencurian akun.
**How (Bagaimana):** Library ini akan dipanggil oleh sebuah `Filter` di Spring Boot. Tiap IP diberikan "ember" berisi sejumlah token. Setiap *request* akan mengambil 1 token. Jika token habis, akses ditolak sementara waktu.

---

## 2. Konfigurasi: Flyway Database Migration
**What (Apa):** Konfigurasi Spring Boot untuk mengaktifkan *Flyway* (alat migrasi skema database).
**Why (Mengapa):** Menjaga *Version Control* pada struktur *Database*. Mencegah terjadinya inkonsistensi tabel antar developer dan memastikan skema selalu sinkron secara otomatis.
**Where (Di mana):** Berada pada file `application.yml` (di bawah blok `spring.flyway`).
**Who (Siapa):** Database Administrator (DBA) dan Backend Developer.
**How (Bagaimana):** Saat Spring Boot mulai menyala (startup), Flyway (`enabled: true`) akan membaca skrip SQL di dalam direktori `classpath:db/migration` (misal V1, V2, dst) dan mengeksekusinya secara berurutan ke database jika belum pernah dijalankan (`validate-on-migrate: true`).

---

## 3. Konfigurasi: Multipart Upload
**What (Apa):** Aturan batas maksimal ukuran file yang diunggah.
**Why (Mengapa):** Mencegah serangan *Out of Memory* (OOM) atau habisnya *storage* akibat pengguna/bot mengunggah file gambar (seperti referensi *Custom Order*) berukuran raksasa.
**Where (Di mana):** Didefinisikan di dalam `application.yml` (di bawah blok `spring.servlet.multipart`).
**Who (Siapa):** Backend Developer (penentu aturan) dan *Customer* (yang mengunggah gambar).
**How (Bagaimana):** Tomcat (Server bawaan Spring) akan memblokir dan melempar *Exception* jika sebuah file (`max-file-size`) atau keseluruhan request (`max-request-size`) melebihi batas 10MB sebelum file tersebut sempat masuk ke *Controller*.

---

## 4. Konfigurasi: Spring Boot Actuator
**What (Apa):** Endpoint pemantauan (*monitoring*) internal aplikasi.
**Why (Mengapa):** Memungkinkan *monitoring tools* eksternal untuk mengecek apakah aplikasi sedang sehat (Up), sakit (Down), atau butuh penanganan, serta untuk melihat matriks memori/CPU.
**Where (Di mana):** Konfigurasi pada `application.yml` di bawah blok `management.endpoints`.
**Who (Siapa):** *DevOps Engineer*, SRE (Site Reliability Engineer), dan *System Administrator*.
**How (Bagaimana):** Spring Boot otomatis membuka endpoint seperti `/actuator/health` dan `/actuator/metrics`. Pengaturan `show-details: always` membuat siapa saja yang mengakses endpoint `health` bisa melihat rincian kondisi koneksi DB dan *disk space*.

---

## 5. File: `logback-spring.xml`
**What (Apa):** File konfigurasi mesin pencatat log aplikasi (Logback).
**Why (Mengapa):** Untuk merekam jejak (audit trail) segala kejadian penting, error, dan transaksi ke dalam sebuah file, tidak hanya lewat teks di layar *terminal*.
**Where (Di mana):** Lokasinya di `backend/src/main/resources/logback-spring.xml`.
**Who (Siapa):** Tim Dukungan IT (*IT Support*) atau *Developer* yang bertugas melakukan perbaikan (*debugging*).
**How (Bagaimana):** Logback akan menangkap semua log dengan level `INFO` ke atas, lalu mencetaknya ke konsol (layar) dan menyimpannya ke `logs/ecommerce-backend.log`. Setiap berganti hari, file akan dipecah (*rolling rollover*) dengan batas riwayat penyimpanan hingga 30 hari.

---

## 6. File: `RateLimitFilter.java`
**What (Apa):** Kelas Servlet Filter kustom yang menjadi wujud nyata eksekusi library *Bucket4j*.
**Why (Mengapa):** Karena *library* pada poin (1) butuh logika penempatannya. Filter inilah yang mencegat *request* HTTP secara harfiah sebelum mencapai sistem keamanan JWT.
**Where (Di mana):** `com.otaku.ecommerce.security.RateLimitFilter.java`
**Who (Siapa):** Diurus oleh *Security Engineer* atau Tim Backend.
**How (Bagaimana):** Filter membaca *IP Address* pengunjung (`X-Forwarded-For` atau `RemoteAddr`). Jika mengakses `/auth/login`, dibatasi maksimal 5 hit per menit. Jika melebihi batas, Filter langsung menolak *request* dengan mencetak JSON error "Terlalu banyak percobaan".

---

## 7. File: `SecurityConfig.java`
**What (Apa):** Jantung utama sistem keamanan *Spring Security*.
**Why (Mengapa):** Bertugas menetapkan "Siapa boleh mengakses apa", menonaktifkan CSRF (karena menggunakan JWT), mengatur CORS (agar frontend React bisa masuk), dan menentukan urutan saringan (Filter).
**Where (Di mana):** `com.otaku.ecommerce.config.SecurityConfig.java`
**Who (Siapa):** Backend Developer / Security Architect.
**How (Bagaimana):** Kelas ini merangkai *SecurityFilterChain*. Menetapkan rute seperti `/api/v1/auth/**` sebagai *Public*, sedangkan `/api/v1/admin/**` wajib memiliki hak akses (Role) `Admin`. Selain itu, kelas ini menaruh `RateLimitFilter` dan `JwtAuthenticationFilter` agar berjalan secara berurutan.

---

## 8. File: `DataCleanupScheduler.java`
**What (Apa):** Sebuah *Cron Job* otomatis yang terintegrasi di dalam aplikasi.
**Why (Mengapa):** Menjaga *Database* tetap bersih dari *junk data* (data sampah) seperti pesanan (`Order`) berstatus *Pending* yang ditinggalkan pengguna tanpa pembayaran selama berhari-hari.
**Where (Di mana):** `com.otaku.ecommerce.scheduler.DataCleanupScheduler.java`
**Who (Siapa):** Bergerak sendiri sebagai mesin sistem (*Automated Background Task*).
**How (Bagaimana):** Berkat anotasi `@Scheduled(cron = "0 0 0 * * ?")`, Spring Boot akan menjalankan *method* ini setiap tengah malam. Logikanya mencari pesanan berstatus "Pending" yang usianya lewat dari 3 hari, lalu menghapusnya (`orderRepository.deleteAll()`) dari tabel secara massal.

---

## 9. Penegasan Lanjutan: Respons `RateLimitFilter.java`
*(Point 9 merujuk kembali pada file yang sama dengan Point 6, difokuskan pada respons mitigasi)*
**What (Apa):** Output (keluaran) paksa dari sistem saat terjadi serangan.
**Why (Mengapa):** Klien (Frontend atau Attacker) harus tahu secara pasti mengapa request mereka diputus di tengah jalan.
**Where (Di mana):** Fungsi `writeRateLimitResponse()` pada `RateLimitFilter.java`.
**Who (Siapa):** Diperuntukkan bagi *Client Application* (React JS / Axios) atau peretas.
**How (Bagaimana):** Filter mengambil alih *response HTTP*. Memaksa mengubah kode status menjadi `429 Too Many Requests`. Kemudian menimpa *body* dengan JSON beralamat `OTK-4290` (kode internal khusus Otaku E-Commerce), sehingga Frontend bisa mendeteksi dengan presisi dan memunculkan *Toast Alert* ke pengguna tanpa membuat aplikasi nge-blank.

---

## 10. Script: `start-backend.ps1`
**What (Apa):** Skrip utilitas berbasis Windows PowerShell untuk *DevOps / Local Development*.
**Why (Mengapa):** Memecahkan masalah klasik *Developer* di lingkungan Windows, yaitu "*Address already in use*" (Port 8321 nyangkut) dan database *SQL Server* yang lupa dinyalakan dari layanan *Services.msc*.
**Where (Di mana):** Berada di pangkal root folder project `start-backend.ps1`.
**Who (Siapa):** Digunakan oleh *Developer* atau proses CI/CD.
**How (Bagaimana):** Saat dijalankan, skrip melakukan 3 fase:
1. Memakai perintah `Get-Service` untuk memeriksa status `MSSQLSERVER`. Jika mati, skrip melakukan `Start-Service`.
2. Mengeksekusi `netstat -ano` untuk mencari PID aplikasi yang menyandera Port 8321, lalu membunuhnya dengan `taskkill /F`.
3. Menanamkan *Environment Variable* port sementara, kemudian mengeksekusi `mvn spring-boot:run` untuk menyalakan backend dengan mulus.
