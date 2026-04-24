# 🔧 Rencana Perbaikan Integrasi Frontend-Backend

**Tanggal**: 24 April 2026  
**Status**: Menunggu Persetujuan  
**Prioritas**: KRITIS

---

## 📌 Ringkasan Masalah

Setelah migrasi dari data *hardcoded* ke API *live* pada Fase 5, website mengalami beberapa kegagalan kritis:

1. **Produk tidak muncul** di halaman Home, Manga, dan Merchandise
2. **Cart tidak berfungsi** untuk Guest maupun User login
3. **Checkout gagal total** — order tidak bisa dibuat
4. **Profile tidak bisa diakses** tanpa login

---

## 🔍 Analisis Akar Masalah (Root Cause Analysis)

### Bug #1: CORS Memblokir Header `X-Guest-ID`

| Aspek | Detail |
|-------|--------|
| **File** | `SecurityConfig.java` baris 81-84 |
| **Masalah** | Header `X-Guest-ID` tidak terdaftar di `allowedHeaders` CORS |
| **Dampak** | Browser menolak request Guest Cart → CartContext error saat mount → seluruh halaman gagal render |

```java
// SAAT INI — tidak ada X-Guest-ID
configuration.setAllowedHeaders(Arrays.asList(
    "Authorization", "Cache-Control", "Content-Type",
    "X-Requested-With", "Accept", "Origin"
));
```

**Ini adalah bug paling kritis** karena `CartContext.jsx` dipanggil di **setiap halaman** via `CartProvider`. Saat context gagal fetch cart (karena CORS block), seluruh React tree bisa terdampak.

---

### Bug #2: CartContext Mengganggu Halaman Publik (Products)

| Aspek | Detail |
|-------|--------|
| **File** | `CartContext.jsx` baris 37-53 |
| **Masalah** | `fetchCart()` dipanggil segera saat mount. Untuk Guest, ia memanggil `/api/v1/cart/guest` yang butuh `X-Guest-ID` header — tetapi header ini di-block CORS (Bug #1) |
| **Dampak** | Error CORS di console → React error boundary atau silent failure → halaman produk (yang seharusnya publik) ikut terdampak |

---

### Bug #3: `addToCart` Mengirim Data yang Tidak Kompatibel dengan Backend

| Aspek | Detail |
|-------|--------|
| **File** | `Home.jsx`, `Manga.jsx`, `Merchandise.jsx` → fungsi `addToCart()` |
| **Masalah** | Frontend mengirim object `{ productId, name, price, imageUrl, details, quantity }` ke `CartContext.addToCart()`, tetapi `CartRequestDTO` di backend hanya menerima `{ productId, customOrderId, quantity }`. Field `name`, `price`, `imageUrl`, `details` diabaikan backend — ini benar. Namun yang salah: saat guest tanpa login, POST ke `/api/v1/cart/guest` tetap butuh `X-Guest-ID` header (kembali ke Bug #1) |

---

### Bug #4: Checkout `total` Tidak Memperhitungkan `quantity`

| Aspek | Detail |
|-------|--------|
| **File** | `Checkout.jsx` baris 21 |
| **Masalah** | `cart.reduce((acc, item) => acc + item.price, 0)` — tidak mengalikan dengan `item.quantity` |
| **Dampak** | Total harga salah, mismatch dengan backend |

```javascript
// SAAT INI — salah
const total = cart.reduce((acc, item) => acc + item.price, 0);

// SEHARUSNYA
const total = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
```

---

### Bug #5: Halaman Produk Tidak Ada Fallback Saat API Gagal

| Aspek | Detail |
|-------|--------|
| **File** | `Home.jsx`, `Manga.jsx`, `Merchandise.jsx` |
| **Masalah** | Jika API `/api/v1/products` gagal (backend mati, CORS, dll), halaman hanya menampilkan "Loading..." selamanya atau kosong. Tidak ada pesan error atau data fallback |
| **Dampak** | UX buruk — user melihat halaman kosong tanpa penjelasan |

---

### Bug #6: Genre Filter Manga Bergantung pada `description`

| Aspek | Detail |
|-------|--------|
| **File** | `Manga.jsx` baris 55-56 |
| **Masalah** | Filter genre menggunakan `m.description.includes(activeGenre)` — ini fragile dan bisa null. Data mock sebelumnya punya field `genre`, tapi backend `ProductDTO` tidak punya field `genre` |
| **Dampak** | Filter genre tidak berfungsi / crash jika `description` null |

---

### Bug #7: `UserController` Tidak Terdaftar di SecurityConfig

| Aspek | Detail |
|-------|--------|
| **File** | `SecurityConfig.java` |
| **Masalah** | Path `/api/v1/users/**` tidak di-*whitelist* secara eksplisit. Ia jatuh ke `.anyRequest().authenticated()` yang membutuhkan auth — ini sebenarnya benar. Tetapi CORS header yang kurang bisa menyebabkan preflight gagal |

---

## ✅ Rencana Perbaikan

### Fase A: Fix CORS & Security (Prioritas Tertinggi)

#### A1. Tambah `X-Guest-ID` ke CORS Allowed Headers
**File**: `backend/.../config/SecurityConfig.java`
```java
configuration.setAllowedHeaders(Arrays.asList(
    "Authorization", "Cache-Control", "Content-Type",
    "X-Requested-With", "Accept", "Origin",
    "X-Guest-ID"  // ← TAMBAH INI
));
```

#### A2. Tambah `X-Guest-ID` ke CORS Exposed Headers
```java
configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Guest-ID"));
```

---

### Fase B: Fix CartContext Resilience

#### B1. Perbaiki `CartContext.jsx` agar tidak crash halaman publik
**File**: `frontend/src/contexts/CartContext.jsx`
- Tambahkan `try-catch` yang lebih robust pada `fetchCart`
- Pastikan error tidak mem-propagate ke halaman produk
- Jika CORS error, fallback ke empty array tanpa console.error yang menakutkan

---

### Fase C: Fix Halaman Produk

#### C1. Tambahkan Error State dan UI Feedback
**File**: `Home.jsx`, `Manga.jsx`, `Merchandise.jsx`
- Tambah state `error` untuk menampilkan pesan saat API gagal
- Tampilkan pesan "Gagal memuat produk. Coba refresh halaman." alih-alih halaman kosong

#### C2. Fix Genre Filter di Manga.jsx
**File**: `Manga.jsx`
- Gunakan optional chaining: `m.description?.includes(activeGenre)` untuk menghindari crash saat description null

#### C3. Fix Total Calculation di Checkout.jsx
**File**: `Checkout.jsx`
- Ubah rumus `total` agar mengalikan `price * quantity`

---

### Fase D: Restart & Verifikasi End-to-End

#### D1. Rebuild dan Restart Backend
```bash
mvn clean package -DskipTests
mvn spring-boot:run
```

#### D2. Verifikasi via Browser
1. Buka halaman Home → Pastikan produk muncul
2. Buka halaman Manga → Pastikan manga muncul dengan filter
3. Buka halaman Merchandise → Pastikan merchandise muncul
4. Tambah item ke cart (sebagai Guest) → Pastikan berhasil
5. Login → Pastikan cart tersinkronisasi
6. Buka Profile → Pastikan data terisi dari API
7. Checkout → Pastikan order berhasil dibuat

---

## 📁 Daftar File yang Akan Dimodifikasi

| No | File | Tipe Perubahan | Urgensi |
|----|------|----------------|---------|
| 1 | `SecurityConfig.java` | Tambah CORS header | 🔴 Kritis |
| 2 | `CartContext.jsx` | Perbaiki error handling | 🔴 Kritis |
| 3 | `Checkout.jsx` | Fix kalkulasi total (quantity) | 🟡 Penting |
| 4 | `Manga.jsx` | Fix null-safety filter genre | 🟡 Penting |
| 5 | `Home.jsx` | Tambah error state | 🟢 Bagus |
| 6 | `Merchandise.jsx` | Tambah error state | 🟢 Bagus |

---

## ⏱️ Estimasi Waktu Pengerjaan

| Fase | Durasi |
|------|--------|
| Fase A: CORS Fix | ~5 menit |
| Fase B: CartContext | ~5 menit |
| Fase C: Halaman Produk | ~10 menit |
| Fase D: Build & Verifikasi | ~10 menit |
| **Total** | **~30 menit** |
