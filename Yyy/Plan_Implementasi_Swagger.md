# Plan Implementasi Swagger (OpenAPI 3)

Rencana ini bertujuan untuk menambahkan dokumentasi API interaktif menggunakan **Swagger UI** di backend agar manajemen API menjadi lebih mudah dan terstruktur.

---

## 📅 Rundown Pengerjaan

### Step 1: Instalasi & Setup Library
*   **Aksi**: Menambahkan `springdoc-openapi-starter-webmvc-ui` versi `2.5.0` ke dalam file `pom.xml`.
*   **Tujuan**: Memasang engine Swagger UI yang kompatibel dengan Spring Boot 3.

### Step 2: Konfigurasi Keamanan (JWT di Swagger)
*   **Aksi**: Membuat Class `SwaggerConfig.java` atau menambahkan Bean OpenAPI.
*   **Detail**: Menambahkan skema "Bearer Authentication" agar user bisa memasukkan JWT token langsung di UI Swagger.

### Step 3: Pengecekan Error & Debugging
*   **Aksi**: Menjalankan `mvn spring-boot:run` dan memantau terminal.
*   **Perbaikan**: Menangani jika ada error `Whitelabel Error Page` atau rute yang terblokir oleh Spring Security.

### Step 4: Live Preview
*   **Aksi**: Menampilkan status server dan ketersediaan UI.
*   **Link Akses**: `http://localhost:8321/swagger-ui/index.html`

### Step 5: Penyerahan untuk Testing
*   Memberikan instruksi cara mengetes API Login melalui UI Swagger.

---

> [!NOTE]
> Setelah rencana ini disetujui, saya akan mulai dari Step 1. Nilai tambah dari Swagger ini adalah Anda tidak perlu lagi menggunakan Postman untuk sekadar mengecek endpoint backend.
