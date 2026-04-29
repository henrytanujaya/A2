# 📋 Dokumentasi Fase 1: Pemantapan Integrasi & Keamanan

**Tanggal Eksekusi**: 23 April 2026  
**PIC**: Antigravity AI  
**Status**: ✅ Selesai

---

## 📌 Ringkasan Eksekutif

Fase 1 berfokus pada pemantapan pondasi keamanan komunikasi Frontend-Backend, mencakup 4 poin utama:

| # | Task | Status | File yang Diubah |
|---|------|--------|------------------|
| 1 | Verifikasi Autentikasi Hybrid (JWT + Session Redis) | ✅ Verified | — (sudah benar) |
| 2 | Pengetesan CORS untuk semua origin | ✅ Fixed | `SecurityConfig.java` |
| 3 | Audit RBAC pada SecurityConfig | ✅ Fixed | `SecurityConfig.java`, `OrderController.java`, `CustomOrderController.java` |
| 4 | Penyesuaian ApiResponse agar seragam | ✅ Fixed | `ApiResponse.java`, `axiosInstance.js`, `Login.jsx`, `Navbar.jsx` |

---

## 1️⃣ Verifikasi Autentikasi Hybrid (JWT + Session Redis)

### Hasil Audit

Mekanisme autentikasi hybrid sudah **terimplementasi dengan baik**. Arsitektur:

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Frontend    │────▶│  JwtAuthFilter   │────▶│  Controller  │
│  (Bearer)    │     │  3-Layer Check   │     │              │
└─────────────┘     └──────────────────┘     └──────────────┘
                           │
                     ┌─────┴──────┐
                     │            │
                ┌────▼───┐  ┌────▼────┐
                │ Redis  │  │ Session │
                │ Token  │  │ Redis   │
                │ Black  │  │ Store   │
                │ list   │  │         │
                └────────┘  └─────────┘
```

### 3 Layer Validasi JWT (`JwtAuthenticationFilter.java`)

| Layer | Deskripsi | Implementasi |
|-------|-----------|--------------|
| **Layer 1** | Validasi signature & expiration via JJWT | `jwtUtil.validateToken(jwt)` |
| **Layer 2** | Cek JTI blacklist (token sudah logout?) | `tokenBlacklistService.isJtiBlacklisted(jti)` |
| **Layer 3** | Cek force-logout status (Admin kick?) | `tokenBlacklistService.isForceLoggedOut(userId)` |

### Dual Token System (`JwtUtil.java`)

| Token | Expiration | Claim | Storage |
|-------|-----------|-------|---------|
| **Access Token** | 15 menit (`900000ms`) | `userId`, `role`, `type:access`, `jti` | `localStorage` (FE) |
| **Refresh Token** | 7 hari (`604800000ms`) | `type:refresh` | DB (`RefreshToken` table) + `localStorage` (FE) |

### Session Redis Integration

```java
// JwtAuthenticationFilter.java (Line 91)
request.getSession().setAttribute("SPRING_SECURITY_CONTEXT", context);
```

```yaml
# application.yml
spring.session.store-type: redis
spring.data.redis.host: localhost
spring.data.redis.port: 6379
```

**Kesimpulan**: ✅ Tidak ada perubahan diperlukan. Implementasi sudah sesuai standar.

---

## 2️⃣ Pengetesan & Perbaikan CORS

### Masalah Ditemukan

| # | Issue | Severity |
|---|-------|----------|
| 1 | Header `X-Requested-With`, `Accept`, `Origin` tidak diizinkan | Medium |
| 2 | Header `Authorization` tidak di-expose ke frontend | High |
| 3 | Tidak ada `maxAge` — preflight request dilakukan setiap kali | Low |

### Perbaikan pada `SecurityConfig.java`

```diff
 configuration.setAllowedHeaders(Arrays.asList(
-        "Authorization", "Cache-Control", "Content-Type"
+        "Authorization", "Cache-Control", "Content-Type",
+        "X-Requested-With", "Accept", "Origin"
 ));
+configuration.setExposedHeaders(Arrays.asList("Authorization"));
 configuration.setAllowCredentials(true);
+configuration.setMaxAge(3600L); // Cache preflight 1 jam
```

### Konfigurasi CORS Final

| Parameter | Value |
|-----------|-------|
| **Allowed Origins** | `http://localhost:5173`, `http://localhost:3000` |
| **Allowed Methods** | `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH` |
| **Allowed Headers** | `Authorization`, `Cache-Control`, `Content-Type`, `X-Requested-With`, `Accept`, `Origin` |
| **Exposed Headers** | `Authorization` |
| **Allow Credentials** | `true` |
| **Max Age** | `3600` detik (1 jam cache preflight) |

---

## 3️⃣ Audit Role-Based Access Control (RBAC)

### A. URL-Level Security (`SecurityConfig.java`)

Konfigurasi sudah lengkap dengan pola defense-in-depth:

| Endpoint Pattern | Akses | Keterangan |
|-----------------|-------|------------|
| `/`, `/error` | Public | Landing & error page |
| `/api/v1/auth/**` | Public | Login, Register, Refresh, Logout |
| `GET /api/v1/products/**` | Public | Browsing katalog produk |
| `GET /api/v1/discounts/**` | Public | Validasi kode diskon |
| `/v3/api-docs/**`, `/swagger-ui/**` | Public | Swagger/OpenAPI documentation |
| `/api/v1/admin/**` | Admin | Semua endpoint admin |
| `POST/PUT/DELETE/PATCH /api/v1/products` | Admin | CRUD produk |
| `POST/PUT/DELETE /api/v1/discounts` | Admin | CRUD diskon |
| `/api/v1/orders/**` | Customer + Admin | Order management |
| `/api/v1/custom-orders/**` | Customer + Admin | Custom order management |
| `/api/v1/upload/**` | Customer + Admin | Upload gambar referensi |
| Semua yang lain | Authenticated | Catch-all rule |

### B. Method-Level Security (`@PreAuthorize`)

#### Masalah Ditemukan & Diperbaiki

| Controller | Method | Sebelum | Sesudah |
|-----------|--------|---------|---------|
| `OrderController` | `createOrder` | ❌ Tidak ada `@PreAuthorize` | ✅ `@PreAuthorize("hasAnyRole('Customer', 'Admin')")` |
| `OrderController` | `getMyOrders` | ❌ Tidak ada `@PreAuthorize` | ✅ `@PreAuthorize("hasAnyRole('Customer', 'Admin')")` |
| `CustomOrderController` | `createCustomOrder` | ❌ Tidak ada `@PreAuthorize` | ✅ `@PreAuthorize("hasAnyRole('Customer', 'Admin')")` |
| `CustomOrderController` | `getMyCustomOrders` | ❌ Tidak ada `@PreAuthorize` | ✅ `@PreAuthorize("hasAnyRole('Customer', 'Admin')")` |

#### Controller yang Sudah Benar (Tidak perlu perubahan)

| Controller | Security Mechanism |
|-----------|-------------------|
| `ProductController` | ✅ `@PreAuthorize("hasRole('Admin')")` pada POST/PUT/DELETE/PATCH |
| `DiscountController` | ✅ `@PreAuthorize("hasRole('Admin')")` pada POST/PUT/DELETE |
| `AdminOrderController` | ✅ `@PreAuthorize("hasRole('Admin')")` di level class |
| `AdminCustomOrderController` | ✅ `@PreAuthorize("hasRole('Admin')")` di level class |
| `AdminUserController` | ✅ `@PreAuthorize("hasRole('Admin')")` di level class |
| `ImageUploadController` | ✅ `@PreAuthorize("hasAnyRole('Customer', 'Admin')")` per method |
| `OrderController.getOrderById` | ✅ `@PreAuthorize("hasRole('Admin') or @orderSecurity.isOrderOwner(...)")` — IDOR protection |
| `CustomOrderController.getById` | ✅ `@PreAuthorize("hasRole('Admin') or @orderSecurity.isCustomOrderOwner(...)")` — IDOR protection |

### C. IDOR Protection (`OrderSecurityEvaluator.java`)

Sudah terimplementasi dengan benar:

```java
@Component("orderSecurity")
public class OrderSecurityEvaluator {
    public boolean isOrderOwner(Integer orderId, String email) { ... }
    public boolean isCustomOrderOwner(Integer customOrderId, String email) { ... }
}
```

### D. Filter Chain Order

```
Request → RateLimitFilter → JwtAuthenticationFilter → UsernamePasswordAuthenticationFilter → Controller
```

| Filter | Fungsi |
|--------|--------|
| `RateLimitFilter` | Brute-force protection: 5 req/min (login/register), 5 req/10min (upload) |
| `JwtAuthenticationFilter` | 3-layer JWT validation + SecurityContext setup |

### E. Rate Limiting (`RateLimitFilter.java`)

| Endpoint | Limit | Bucket |
|----------|-------|--------|
| `/api/v1/auth/login` | 5 request / 1 menit per IP | `loginCache` |
| `/api/v1/auth/register` | 5 request / 1 menit per IP | `loginCache` |
| `/api/v1/upload/*` | 5 request / 10 menit per IP | `uploadCache` |

---

## 4️⃣ Penyesuaian ApiResponse Agar Seragam

### A. Perbaikan `ApiResponse.java`

**Masalah**: `@Pattern` validation pada field output DTO tidak tepat secara semantik dan bisa mengganggu serialisasi.

```diff
 package com.otaku.ecommerce.dto;
 
 import java.time.LocalDateTime;
-import jakarta.validation.constraints.Pattern;
 
 public class ApiResponse<T> {
     private boolean success;
-    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Format internal code tidak valid")
     private String internalCode;
-    @Pattern(regexp = "^[<>{}]*$", message = "Format pesan tidak valid")
     private String message;
```

> **Catatan**: Regex `^[A-Z0-9_]+$` juga salah — tidak mengizinkan karakter `-` yang digunakan di semua internal code (`OTK-XXXX`). Karena ini output DTO, validasi dihapus sepenuhnya.

### B. Audit Keseragaman Internal Code di Seluruh Controller

Semua controller sudah menggunakan format `ApiResponse` yang konsisten:

| Modul | Success Codes | Error Codes |
|-------|--------------|-------------|
| **Auth** | `OTK-2001` (login), `OTK-2002` (register), `OTK-2003` (refresh), `OTK-2004` (logout) | `OTK-4001`, `OTK-4005`, `OTK-4006`, `OTK-4010`, `OTK-4012` |
| **Product** | `OTK-2010` – `OTK-2015` | — |
| **Order** | `OTK-2020` – `OTK-2024` | `OTK-4010` |
| **Custom Order** | `OTK-2030` – `OTK-2035` | `OTK-4010`, `OTK-4045` |
| **Discount** | `OTK-2040` – `OTK-2043` | — |
| **User (Admin)** | `OTK-2050` – `OTK-2054` | `OTK-4010`, `OTK-4041` |
| **Upload** | `OTK-2031`, `OTK-2032` | — |
| **Global Error** | — | `OTK-4000` (bad JSON), `OTK-4004` (403/404), `OTK-4005` (method not allowed), `OTK-4290` (rate limit), `OTK-5000` (server error), `OTK-5001` (upload error) |

### C. Perbaikan Frontend: Hardcoded Admin Bypass Dihapus

**Masalah Kritis**: `Login.jsx` memiliki backdoor hardcoded:

```javascript
// DIHAPUS — Security Vulnerability!
if (email === 'admin' && password === 'password') {
    const adminUser = { id: 0, name: 'Super Admin', ... };
    // Bypass autentikasi backend sepenuhnya
}
```

**Perbaikan**: Semua login (termasuk Admin) sekarang melalui API backend `/api/v1/auth/login`. Routing otomatis berdasarkan role dari response:

```javascript
const isAdmin = user?.role === 'Admin';
const destination = isAdmin ? '/admin' : '/';
```

### D. Perbaikan Frontend: Axios Interceptor + Auto Refresh

**Sebelum** — Interceptor hanya stub tanpa implementasi refresh:

```javascript
// Sebelum (TIDAK BERFUNGSI)
if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    // Implement refresh token logic here if needed  ← KOSONG
}
```

**Sesudah** — Full implementation:

| Fitur | Status |
|-------|--------|
| Auto refresh token on 401 | ✅ |
| Request queue during refresh (race condition prevention) | ✅ |
| Token rotation (old refresh token invalidated) | ✅ |
| Force logout on refresh failure | ✅ |
| Redirect ke `/login` saat token expired | ✅ |
| Skip refresh untuk endpoint `/api/v1/auth/*` | ✅ |
| `withCredentials: true` untuk Session Redis cookie | ✅ |

### E. Perbaikan Frontend: Navbar Logout

**Sebelum** — Logout hanya mengubah state lokal, token JWT masih valid di server:

```javascript
onClick={() => setIsLoggedIn(false)}  // Token JWT masih bisa dipakai!
```

**Sesudah** — Logout memanggil backend API untuk blacklist JWT:

```javascript
const handleLogout = async () => {
    await axiosInstance.post('/api/v1/auth/logout');  // Blacklist JTI di Redis
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    navigate('/login');
};
```

---

## 📁 Daftar File yang Dimodifikasi

| # | File | Perubahan |
|---|------|-----------|
| 1 | `backend/.../config/SecurityConfig.java` | CORS header/expose/maxAge diperbaiki |
| 2 | `backend/.../dto/ApiResponse.java` | Hapus `@Pattern` yang tidak sesuai |
| 3 | `backend/.../controller/OrderController.java` | Tambah `@PreAuthorize` pada `createOrder` & `getMyOrders` |
| 4 | `backend/.../controller/CustomOrderController.java` | Tambah `@PreAuthorize` pada `createCustomOrder` & `getMyCustomOrders` |
| 5 | `frontend/src/api/axiosInstance.js` | Full rewrite: auto refresh, queue, force logout, withCredentials |
| 6 | `frontend/src/pages/Login.jsx` | Hapus hardcoded admin bypass, auto-route by role |
| 7 | `frontend/src/components/Navbar.jsx` | Logout memanggil backend API + clear localStorage |

---

## 🔍 Komponen yang Sudah Benar (Tidak Perlu Perubahan)

| Komponen | Keterangan |
|----------|------------|
| `JwtAuthenticationFilter.java` | 3-layer validation sudah lengkap |
| `JwtUtil.java` | Dual token (access+refresh) sudah benar |
| `TokenBlacklistService.java` | Redis JTI blacklist + force-logout sudah berfungsi |
| `RateLimitFilter.java` | Bucket4j rate limiting sudah terpasang |
| `OrderSecurityEvaluator.java` | IDOR protection sudah berfungsi |
| `GlobalExceptionHandler.java` | 7 handler sudah lengkap, semua return `ApiResponse` |
| `AuthService.java` | BCrypt, token rotation, force-logout sudah benar |
| `application.yml` | JWT config, Redis, Session, Flyway sudah benar |

---

*Dokumen ini adalah laporan eksekusi Fase 1 dari Rundown Pengembangan Otaku E-Commerce.*  
*Fase berikutnya: Fase 2 — Database Alignment.*
