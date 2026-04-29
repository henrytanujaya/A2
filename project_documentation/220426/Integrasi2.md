# Analisa Integrasi Sistem Otaku E-Commerce

Dokumen ini berisi hasil analisa mendalam mengenai integrasi antara Frontend, Backend, dan Database, serta rencana implementasi fitur Redis pada sistem autentikasi.

## 1. Analisa Sektor Sistem

### A. Frontend (React)
- **Teknologi**: React (Vite) pada port 5173.
- **Status Integrasi**:
    - Saat ini berkomunikasi dengan Backend via REST API.
    - Mengelola JWT (Access & Refresh Token) di sisi client.
    - Memerlukan sinkronisasi state user saat terjadi force-logout atau token expiry.

### B. Backend (Spring Boot)
- **Teknologi**: Spring Boot 3.2.4, Spring Security, JJWT.
- **Status Integrasi**:
    - Menggunakan `JwtAuthenticationFilter` untuk validasi token.
    - Implementasi `AuthService` untuk login/register/refresh-token.
    - Terhubung ke Redis untuk manajemen blacklist token.
    - **Temuan**: Masih ada layer validasi (Force Logout) yang tertulis di Javadoc tapi belum terimplementasi sepenuhnya di filter.

### C. Database (SQL Server & Redis)
- **SQL Server**:
    - Menyimpan data persisten (User, Product, Order, RefreshToken).
    - Skema dikelola oleh Flyway Migration.
- **Redis**:
    - Digunakan untuk session management tingkat lanjut (Blacklist & Force Logout).
    - Membantu performa dengan menghindari query DB berulang untuk setiap request yang di-autentikasi.

---

## 2. Rencana Integrasi Sektor (Redis Authentication)

Untuk meningkatkan keamanan dan kontrol sesi, berikut adalah rencana integrasi Redis pada alur autentikasi:

### Tahap 1: Pengayaan Klaim JWT
- Menambahkan `userId` ke dalam klaim JWT (Access Token).
- Tujuan: Agar `JwtAuthenticationFilter` dapat melakukan lookup status user di Redis tanpa harus query database SQL Server.

### Tahap 2: Implementasi Force-Logout Filter
- Menambahkan logika pengecekan `tokenBlacklistService.isForceLoggedOut(userId)` di dalam `JwtAuthenticationFilter`.
- Jika user ditandai untuk logout (misal: ganti password atau aksi admin), token akan langsung ditolak meskipun secara signature masih valid.

### Tahap 3: Perbaikan Linting & Safety
- Memperbaiki peringatan *Null type safety* pada `TokenBlacklistService` untuk memastikan kestabilan runtime.

### Tahap 4: Sinkronisasi Frontend
- Memastikan Frontend menangani status code 401 secara global.
- Jika terdeteksi force-logout, Frontend harus menghapus token lokal dan mengarahkan user ke halaman login.

---

## 3. Detail Implementasi Teknis (Backend)

| Komponen | Perubahan |
| :--- | :--- |
| `JwtUtil.java` | Tambah klaim `userId` pada `generateAccessToken`. |
| `AuthService.java` | Kirim `userId` saat memanggil `generateAccessToken`. |
| `JwtAuthenticationFilter.java` | Ekstrak `userId` dari token dan cek status di Redis. |
| `TokenBlacklistService.java` | Fix linting error pada penggunaan `RedisTemplate`. |

---
*Dibuat oleh: Antigravity AI Coding Assistant*
