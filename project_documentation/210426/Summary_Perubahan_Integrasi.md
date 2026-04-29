# Ringkasan Perubahan & Integrasi Sistem (Sesi Ini)

Dokumen ini mencatat seluruh perubahan teknis dan langkah integrasi yang telah dilakukan untuk menyatukan **Frontend**, **Backend**, dan **Database**.

---

## 1. Konfigurasi Git & Repository
*   **Update Remote**: Mengubah alamat origin ke `https://github.com/Neroneko-cyber/A2.git`.
*   **Push Utama**: Berhasil mengunggah seluruh codebase ke repository GitHub yang baru.

## 2. Infrastruktur & Database (Fase 1 - 3)
*   **SQL Server**: Mengaktifkan service dan memastikan database `OtakuECommerce` terhubung.
*   **Redis**: Menjalankan kontainer Redis melalui Docker (Port 6379) untuk manajemen blacklist token.
*   **Cloudinary**: Memetakan kredensial API asli ke dalam `application.yml`.
*   **Flyway**: Sinkronisasi database berhasil (8 tabel dibuat otomatis, termasuk data dummy).

## 3. Harmonisasi Lingkungan (Fase 4 & 6)
*   **Resolusi Konflik Port**: Mengubah port Frontend dari `8321` ke `5173`.
    ```javascript
    // frontend/vite.config.js
    export default defineConfig({
      server: {
        port: 5173
      }
    })
    ```
*   **Update Node.js**: Transisi ke **v24.15.0** (Vite 8 & React 19 compatibility).
*   **Refresh Dependencies**: Re-install `node_modules` untuk native bindings.

## 4. Integrasi Fullstack (Fase 5 & Bug Fix)
*   **API Client**: Konfigurasi Interseptor JWT.
    ```javascript
    // frontend/src/api/axiosInstance.js 
    axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    ```
*   **Refactoring Auth (Login/Register)**: Mengalihkan dari Mock ke Real API.
    ```javascript
    // Contoh di Login.jsx (Fix Boolean Logic)
    const response = await axiosInstance.post('/api/v1/auth/login', { email, password });
    if (response.data.success) { // Menggunakan boolean success
      localStorage.setItem('accessToken', response.data.data.accessToken);
      alert("Login Berhasil!");
      navigate('/');
    }
    ```
*   **Format Registrasi**:
    ```javascript
    // Register.jsx
    const response = await axiosInstance.post('/api/v1/auth/register', {
      name: username, // Map 'username' ke field 'name' Backend
      email,
      password
    });
    ```

## 5. Keamanan & Konfigurasi Backend
*   **CORS Policy**: Pemberian izin akses ke port 5173.
    ```java
    // backend/src/main/java/com/otaku\ecommerce/config/SecurityConfig.java
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    ```
*   **Environment Mapping (application.yml)**:
    ```yaml
    cloudinary:
      cloud-name: ${CLOUDINARY_CLOUD_NAME:dvyuk3imn}
      api-key: ${CLOUDINARY_API_KEY:221798975154623}
      api-secret: ${CLOUDINARY_API_SECRET:xviTxyjLUXElj4...}
    ```

---

> [!TIP]
> Semua file pendukung integrasi ini dapat ditemukan di folder `Yyy` dan folder `backend/src/main/resources/db/migration`.
