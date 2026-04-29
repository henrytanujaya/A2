# 📋 Dokumentasi Fase 2: Database Alignment

**Tanggal Eksekusi**: 23 April 2026  
**PIC**: Antigravity AI  
**Status**: ✅ Selesai

---

## 📌 Ringkasan Eksekutif

Fase 2 bertujuan menyelaraskan struktur database (SQL Server) dengan kebutuhan frontend. Melalui audit menyeluruh terhadap **7 entity backend**, **6 halaman frontend**, dan **7 file migrasi Flyway**, ditemukan **11 gap** yang telah diperbaiki.

| Kategori | Gap Ditemukan | Diperbaiki |
|----------|:------------:|:----------:|
| Kolom tabel yang hilang | 8 | ✅ 8 |
| @Pattern pada output DTO | 3 DTO | ✅ 3 |
| Mock data tanpa ImageURL | 25 produk | ✅ 25 |
| Role regex salah di UserDTO | 1 | ✅ 1 |

---

## 1️⃣ Review Schema Database vs Model Frontend

### Metodologi Audit

Setiap halaman frontend diperiksa untuk mengidentifikasi field yang digunakan UI tetapi tidak tersedia di database/API:

```
Frontend Page → Field yang dipakai → Cek Entity → Cek DTO → Cek Migration
```

### Hasil Audit per Halaman

| Halaman Frontend | Field yang Dibutuhkan | Status di DB Sebelumnya |
|-----------------|----------------------|------------------------|
| **Home.jsx** | `rating`, `image` | ❌ Rating tidak ada, ImageURL null |
| **Manga.jsx** | `rating`, `image`, `dateAdded` (sorting) | ❌ Rating & CreatedAt tidak ada |
| **Merchandise.jsx** | Hardcoded (tidak pakai API) | ⚠️ Belum terintegrasi |
| **CustomApparel.jsx** | Upload via `/upload` API | ✅ Sudah OK |
| **Custom3D.jsx** | Upload via `/upload` API | ✅ Sudah OK |
| **Cart.jsx** | `name`, `price`, `image` | ✅ Sudah OK (dari context) |
| **Checkout.jsx** | `address`, `courier`, `name`, `email` | ❌ Address tidak di Users table |
| **Profile.jsx** | `phone`, `address`, `name`, `email` | ❌ Phone & Address tidak ada |

---

## 2️⃣ Identifikasi Kolom/Tabel yang Kurang

### A. Tabel `Products` — 3 Kolom Baru

| Kolom | Tipe | Default | Alasan |
|-------|------|---------|--------|
| `CreatedAt` | `DATETIME` | `GETDATE()` | Frontend Manga.jsx membutuhkan sorting "New Arrivals" berdasarkan tanggal |
| `Rating` | `INT` | `0` | Frontend menampilkan bintang rating (★★★★★) di card produk |
| `Weight` | `INT` | `500` | Diperlukan untuk kalkulasi ongkos kirim (gram) di Checkout |

### B. Tabel `Users` — 2 Kolom Baru

| Kolom | Tipe | Nullable | Alasan |
|-------|------|----------|--------|
| `Phone` | `NVARCHAR(20)` | NULL | Profile.jsx menampilkan field "Nomor Telepon" |
| `Address` | `NVARCHAR(MAX)` | NULL | Profile.jsx & Checkout.jsx membutuhkan alamat pengiriman |

### C. Tabel `Orders` — 3 Kolom Baru

| Kolom | Tipe | Nullable | Alasan |
|-------|------|----------|--------|
| `UpdatedAt` | `DATETIME` | NULL | Tracking kapan status order terakhir diubah |
| `ShippingAddress` | `NVARCHAR(MAX)` | NULL | Menyimpan snapshot alamat pengiriman saat checkout |
| `CourierName` | `NVARCHAR(50)` | NULL | Menyimpan pilihan kurir (JNE/J&T/SiCepat) |

> **Catatan Desain**: `ShippingAddress` disimpan terpisah dari `Users.Address` karena user bisa mengganti alamat profil kapan saja, tetapi alamat pengiriman pada order yang sudah dibuat harus tetap (snapshot principle).

---

## 3️⃣ Pembuatan Script Flyway Migration

### Migration 1: `V20260423110000__add_missing_fields.sql`

Script DDL yang menambahkan 8 kolom baru ke 3 tabel:

```sql
-- Products: 3 kolom baru
ALTER TABLE Products ADD CreatedAt DATETIME DEFAULT GETDATE();
ALTER TABLE Products ADD Rating INT DEFAULT 0;
ALTER TABLE Products ADD Weight INT DEFAULT 500;

-- Users: 2 kolom baru
ALTER TABLE Users ADD Phone NVARCHAR(20) NULL;
ALTER TABLE Users ADD Address NVARCHAR(MAX) NULL;

-- Orders: 3 kolom baru
ALTER TABLE Orders ADD UpdatedAt DATETIME NULL;
ALTER TABLE Orders ADD ShippingAddress NVARCHAR(MAX) NULL;
ALTER TABLE Orders ADD CourierName NVARCHAR(50) NULL;
```

Semua perubahan menggunakan guard `IF NOT EXISTS` untuk idempotency.

### Migration 2: `V20260423110001__update_product_data.sql`

Script DML yang mengisi data `Rating` dan `ImageURL` untuk **25 produk** yang sudah ada:

| Kategori | Jumlah | Rating Range | ImageURL |
|----------|--------|:----------:|----------|
| ActionFigure | 7 | 4–5 | Unsplash figure photos |
| Outfit | 6 | 4–5 | Unsplash fashion photos |
| Manga | 6 | 4–5 | Unsplash manga/book photos |
| BluRay | 6 | 4–5 | Unsplash movie photos |

> **Masalah Kritis yang Diperbaiki**: Semua 25 produk di mock data memiliki `ImageURL = NULL`. Frontend yang menggunakan API backend tidak akan menampilkan gambar produk sama sekali.

---

## 4️⃣ Perbaikan Backend Entity & DTO

### A. Entity yang Diperbarui

| Entity | Field Ditambahkan | Mapping |
|--------|------------------|---------|
| `Product.java` | `createdAt`, `rating`, `weight` | `@Column(name = "CreatedAt")`, dll. |
| `User.java` | `phone`, `address` | `@Column(name = "Phone")`, `@Column(name = "Address")` |
| `Order.java` | `updatedAt`, `shippingAddress`, `courierName` | `@Column(name = "UpdatedAt")`, dll. |

### B. Output DTO yang Diperbaiki

**Masalah Berulang dari Fase 1**: `@Pattern` validasi ditemukan lagi di 3 output DTO — seharusnya hanya di *input* DTO (request):

| DTO | Anotasi yang Dihapus | Masalah |
|-----|---------------------|---------|
| `ProductDTO.java` | `@Pattern` pada category, name, description, imageUrl | Output DTO tidak perlu validasi |
| `UserDTO.java` | `@Pattern` pada name, email, role | Regex role `USER\|ADMIN` **SALAH** — actual roles: `Customer\|Admin` |
| `OrderResponseDTO.java` | `@Pattern` pada status, discountCode | Output DTO tidak perlu validasi |

**Field Baru yang Ditambahkan ke DTO:**

| DTO | Field Baru |
|-----|-----------|
| `ProductDTO` | `createdAt`, `rating`, `weight` |
| `UserDTO` | `phone`, `address` |
| `OrderResponseDTO` | `updatedAt`, `shippingAddress`, `courierName` |

### C. Service Layer yang Diperbarui

| Service | Method | Perubahan |
|---------|--------|-----------|
| `ProductService` | `toDTO()` | Map `createdAt`, `rating`, `weight` |
| `UserService` | `toDTO()` | Map `phone`, `address` |
| `AuthService` | `toUserDTO()` | Map `phone`, `address` (agar login response lengkap) |
| `OrderService` | `buildResponse()` | Map `updatedAt`, `shippingAddress`, `courierName` |
| `OrderService` | `updateOrderStatus()` | Set `updatedAt = now()` saat status berubah |

---

## 📊 Schema Alignment — Before vs After

### Tabel `Products`

```diff
 Products
 ├── ProductID       INT (PK, IDENTITY)
 ├── Category        NVARCHAR(50)
 ├── Name            NVARCHAR(255)
 ├── Description     NVARCHAR(MAX)
 ├── Price           DECIMAL(18,2)
 ├── StockQuantity   INT
 ├── ImageURL        NVARCHAR(MAX)
+├── CreatedAt       DATETIME (DEFAULT GETDATE())
+├── Rating          INT (DEFAULT 0)
+└── Weight          INT (DEFAULT 500)
```

### Tabel `Users`

```diff
 Users
 ├── UserID          INT (PK, IDENTITY)
 ├── Name            NVARCHAR(100)
 ├── Email           NVARCHAR(100) UNIQUE
 ├── PasswordHash    NVARCHAR(255)
 ├── Role            NVARCHAR(20)
 ├── CreatedAt       DATETIME
+├── Phone           NVARCHAR(20) NULL
+└── Address         NVARCHAR(MAX) NULL
```

### Tabel `Orders`

```diff
 Orders
 ├── OrderID         INT (PK, IDENTITY)
 ├── UserID          INT (FK → Users)
 ├── TotalAmount     DECIMAL(18,2)
 ├── DiscountID      INT (FK → Discounts)
 ├── FinalAmount     DECIMAL(18,2)
 ├── Status          NVARCHAR(50)
 ├── CreatedAt       DATETIME
+├── UpdatedAt       DATETIME NULL
+├── ShippingAddress  NVARCHAR(MAX) NULL
+└── CourierName     NVARCHAR(50) NULL
```

---

## 📁 Daftar File yang Dimodifikasi

| # | File | Tipe Perubahan |
|---|------|---------------|
| 1 | `db/migration/V20260423110000__add_missing_fields.sql` | ✨ **Baru** — DDL 8 kolom |
| 2 | `db/migration/V20260423110001__update_product_data.sql` | ✨ **Baru** — DML rating+image |
| 3 | `entity/Product.java` | ✏️ Tambah `createdAt`, `rating`, `weight` |
| 4 | `entity/User.java` | ✏️ Tambah `phone`, `address` |
| 5 | `entity/Order.java` | ✏️ Tambah `updatedAt`, `shippingAddress`, `courierName` |
| 6 | `dto/ProductDTO.java` | ✏️ Hapus @Pattern, tambah 3 field |
| 7 | `dto/UserDTO.java` | ✏️ Hapus @Pattern (role regex salah), tambah 2 field |
| 8 | `dto/OrderResponseDTO.java` | ✏️ Hapus @Pattern, tambah 3 field |
| 9 | `service/ProductService.java` | ✏️ Update `toDTO()` mapping |
| 10 | `service/UserService.java` | ✏️ Update `toDTO()` mapping |
| 11 | `service/AuthService.java` | ✏️ Update `toUserDTO()` mapping |
| 12 | `service/OrderService.java` | ✏️ Update `buildResponse()` + `updateOrderStatus()` |

---

## ⚠️ Catatan untuk Fase Selanjutnya

| # | Item | Prioritas | Keterangan |
|---|------|:---------:|------------|
| 1 | **Checkout belum terintegrasi API** | 🔴 High | Checkout.jsx masih generate invoice lokal, belum memanggil `POST /api/v1/orders` |
| 2 | **Manga.jsx masih hardcoded** | 🟡 Medium | Data manga di frontend masih array statis, belum fetch dari API `/products?category=Manga` |
| 3 | **Home.jsx masih hardcoded** | 🟡 Medium | `topProducts` masih array statis, belum fetch dari API |
| 4 | **Merchandise.jsx — Bundle concept** | 🟡 Medium | Paket bundle belum ada representasi di database (perlu tabel `Bundles` / `BundleItems`) |
| 5 | **Profile save hanya localStorage** | 🟡 Medium | `Profile.jsx` save data hanya ke localStorage, belum ada API `PUT /api/v1/users/profile` |
| 6 | **Order history di Profile** | 🟡 Medium | `Profile.jsx` orders masih `useState([])`, belum fetch dari API |
| 7 | **ProductRequestDTO — rating/weight** | 🟢 Low | Admin perlu bisa set rating dan weight saat create/update produk |

---

*Dokumen ini adalah laporan eksekusi Fase 2 dari Rundown Pengembangan Otaku E-Commerce.*  
*Fase berikutnya: Fase 3 — Modul Keranjang & Sinkronisasi.*
