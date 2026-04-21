# Analisa Sistem & Panduan Integrasi (Fullstack)

Dokumen ini berisi hasil analisa mendalam terhadap folder **frontend**, **backend**, dan **database**, serta langkah-langkah teknis untuk mengintegrasikan seluruh komponen sistem.

---

## 1. Hasil Analisa Folder

### A. Backend (`/backend`)
*   **Framework**: Spring Boot (Java).
*   **Port Default**: `8321` (dikonfigurasi di `application.yml`).
*   **Database**: SQL Server dengan nama database `OtakuECommerce`.
*   **Keamanan**: Menggunakan **JWT (JSON Web Token)** dengan sistem *dual-token* (Access Token & Refresh Token).
*   **Fitur Utama**: 
    *   Manajemen User & Auth.
    *   Sistem Inventaris Produk (Action Figure, Manga, dll).
    *   Sistem Pesanan Kustom (*Custom Orders*) dengan referensi gambar.
    *   Integrasi **Redis** untuk *token blacklist* (logout).
    *   Integrasi **Cloudinary** untuk penyimpanan file gambar.
*   **Migration**: Menggunakan **Flyway** untuk mengelola skema database secara otomatis.

### B. Frontend (`/frontend`)
*   **Framework**: React.js dengan **Vite**.
*   **Port Saat Ini**: `8321` (**Penting**: Terjadi konflik port dengan backend).
*   **Dependencies Utama**: Framer Motion (animasi), Three.js (3D rendering), React Router Dom (navigasi).
*   **Status Integrasi**: Saat ini masih menggunakan **Mock Authentication** (menggunakan `localStorage` dan data *hardcoded*) di file `Login.jsx`. Belum terhubung secara API ke server Spring Boot.
*   **Aset**: Menggunakan Sakura Background dan desain bernuansa gelap premium.

### C. Database (`/database` & `/backend/src/main/resources/db/migration`)
*   **Teknologi**: SQL Server.
*   **Skema**: Terdiri dari tabel `Users`, `Products`, `Orders`, `OrderItems`, `CustomOrders`, dan `Discounts`.
*   **Relasi**: Sudah terdokumentasi dengan baik dalam format `mermaid` di `diagrams_and_flow.md`.
*   **Aset Data**: Tersedia script `V1` hingga `V7` untuk inisialisasi skema dan data dummy (mock data).

---

## 2. Masalah Utama (Conflict & Pending)
1.  **Konflik Port**: Baik Frontend maupun Backend mencoba berjalan di port `8321`. Ini harus diubah agar salah satunya menggunakan port lain (misal: Frontend di `5173`).
2.  **Mock Logic**: Frontend masih berjalan secara terpisah (*standalone*) dengan data palsu. Perlu dibuat library API (seperti Axios) untuk memanggil controller Backend.
3.  **CORS**: Backend perlu dikonfigurasi untuk mengizinkan permintaan dari domain Frontend.

---

## 3. Rundown Integrasi Akutama (Detil & Komprehensif)

Berikut adalah urutan langkah kerja sistematis untuk menghubungkan Frontend, Backend, dan Database secara utuh:

### Fase 1: Persiapan Infrastruktur (Groundwork)
1.  **Database SQL Server**:
    *   Pastikan Service SQL Server aktif. 
    *   Buat database bernama `OtakuECommerce`. 
    *   *Verifikasi*: Jalankan query `SELECT name FROM sys.databases` untuk memastikan DB sudah terdaftar.
2.  **Redis Cache**:
    *   Jalankan Redis di port `6379`. Redis digunakan untuk mem-blacklist token saat user logout.
3.  **Kredensial Cloudinary**:
    *   Dapatkan `CLOUD_NAME`, `API_KEY`, dan `API_SECRET` dari dashboard Cloudinary. Ini wajib ada agar fitur upload gambar kustom tidak error.

### Fase 2: Konfigurasi & Sinkronisasi Backend
1.  **Update application.yml**:
    *   Lokasi: `backend/src/main/resources/application.yml`.
    *   Ganti `${DB_USERNAME}` dan `${DB_PASSWORD}` dengan kredensial SQL Server Anda.
    *   Isi bagian `cloudinary` dengan key yang didapat di Fase 1.
2.  **Final Check Migration**:
    *   Cek folder `db/migration`. Pastikan script `V1__init_schema.sql` sampai `V7__reset_test_passwords.sql` ada di sana.
3.  **Eksekusi Backend**:
    *   Buka terminal di folder `backend`, jalankan:
      ```powershell
      ./mvnw spring-boot:run
      ```
    *   *Verifikasi*: Tunggu hingga muncul log `Started EcommerceBackendApplication`. Cek tabel di database, Flyway seharusnya sudah membuat semua tabel secara otomatis.

### Fase 3: Resolusi Konflik & Setup Frontend
1.  **Ganti Port Frontend**:
    *   Buka `frontend/vite.config.js`.
    *   **WAJIB**: Ubah `server: { port: 8321 }` menjadi `server: { port: 5173 }`.
2.  **Instalasi Konektor API**:
    *   Di terminal folder `frontend`, jalankan:
      ```bash
      npm install axios
      ```
3.  **Konfigurasi Axios Instance**:
    *   Buat file `frontend/src/api/axios.js`.
    *   Set `baseURL: 'http://localhost:8321'`.

### Fase 4: Refactoring Autentikasi (Mock ke Real)
1.  **Login Logic**:
    *   Buka `frontend/src/pages/Login.jsx`.
    *   Hapus logika `localStorage.getItem('kitsuneMockUser')`.
    *   Implementasikan `axios.post('/api/auth/login', { email, password })`.
2.  **Register Logic**:
    *   Hubungkan form register ke endpoint `/api/auth/register`.
3.  **State Management**:
    *   Simpan Access Token yang diterima dari backend ke dalam context atau state global aplikasi.

### Fase 5: Penanganan Keamanan Cross-Origin (CORS)
1.  **Backend Permission**:
    *   Buka `SecurityConfig.java` di backend.
    *   Pastikan konfigurasi CORS mengizinkan `http://localhost:5173`. Tanpa ini, browser akan memblokir semua request dari frontend.

### Fase 6: Uji Coba & Validasi Sistem (E2E)
1.  **Flow Registrasi**: Buat akun baru -> cek tabel `Users`.
2.  **Flow Login**: Masuk dengan akun baru -> pastikan JWT token diterima.
3.  **Flow Custom Order**: Unggah gambar di menu Custom -> pastikan gambar muncul di Cloudinary dan data tersimpan di tabel `CustomOrders`.

---

> [!IMPORTANT]
> Jangan lupa menjalankan perintah `npm install` di folder frontend sebelum memulai untuk memastikan semua library (seperti Framer Motion & Three.js) sudah terpasang.
