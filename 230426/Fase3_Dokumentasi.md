# 📋 Dokumentasi Fase 3: Modul Keranjang & Sinkronisasi

**Tanggal Eksekusi**: 23 April 2026  
**PIC**: Antigravity AI  
**Status**: ✅ Selesai

---

## 📌 Ringkasan Eksekutif

Fase 3 bertujuan untuk mengimplementasikan modul keranjang (shopping cart) yang mendukung baik pengguna tamu (guest) maupun pengguna yang sudah login. Data keranjang guest disimpan di Redis agar cepat dan sementara, sementara data keranjang pengguna yang login disimpan di database SQL Server agar persisten. Selain itu, telah ditambahkan mekanisme sinkronisasi untuk menggabungkan keranjang guest ke dalam keranjang pengguna saat login.

| Fitur | Status | Keterangan |
|-------|:------:|------------|
| Skema Database Keranjang | ✅ | Tabel `CartItems` dibuat melalui Flyway Migration |
| Entity & Repository | ✅ | `CartItem.java` dan `CartItemRepository.java` diimplementasi |
| Redis untuk Guest Cart | ✅ | Menggunakan `RedisTemplate` untuk menyimpan JSON keranjang per `guestId` |
| DB untuk User Cart | ✅ | Disimpan di SQL Server terelasi dengan `UserID` |
| Sinkronisasi (Merge) Cart | ✅ | API `POST /api/v1/cart/sync` untuk menggabungkan data saat login |

---

## 1️⃣ Skema Database (Flyway Migration)

### Migration: `V20260423120000__create_cart_items_table.sql`

Membuat tabel `CartItems` untuk menyimpan item keranjang pengguna yang sudah login:

```sql
CREATE TABLE CartItems (
    CartItemID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    ProductID INT NULL,
    CustomOrderID INT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    CONSTRAINT FK_CartItems_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT FK_CartItems_Product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    CONSTRAINT FK_CartItems_CustomOrder FOREIGN KEY (CustomOrderID) REFERENCES CustomOrders(CustomOrderID) ON DELETE SET NULL,
    CONSTRAINT CHK_CartItem_Target CHECK (ProductID IS NOT NULL OR CustomOrderID IS NOT NULL)
);
```

Tabel ini mendukung dua jenis produk: reguler (`ProductID`) dan kustom (`CustomOrderID`). Constraint `CHK_CartItem_Target` memastikan setidaknya satu jenis ID produk terisi.

---

## 2️⃣ Implementasi Backend

### A. Data Transfer Objects (DTO)
- **`CartItemDTO`**: Representasi item keranjang saat dikembalikan ke frontend.
- **`CartRequestDTO`**: Request body untuk menambahkan atau mengubah kuantitas item.
- **`CartSyncRequestDTO`**: DTO khusus berisi daftar `CartRequestDTO` untuk dikirimkan dari frontend saat proses sinkronisasi setelah login.

### B. CartService
Service ini mengelola dua sumber data berbeda dengan antarmuka yang seragam:

1. **Guest Cart (Redis)**
   - Menggunakan key `guest_cart:{guestId}`.
   - Disimpan sebagai string JSON menggunakan `ObjectMapper`.
   - Kedaluwarsa dalam 7 hari (`CART_TTL_DAYS`).
   - Menyediakan fungsi virtual ID untuk setiap item agar frontend dapat mengidentifikasinya dengan mudah tanpa bergantung pada database ID.

2. **User Cart (Database)**
   - Operasi langsung ke tabel `CartItems` melalui repository.
   - Terdapat validasi kepemilikan (`check email`) sebelum mengubah atau menghapus item.

3. **Sinkronisasi (Merge)**
   - Fungsi `syncGuestCartToUser` menerima daftar item dari guest cart dan memanggil `addUserCartItem` satu per satu.
   - Jika item sudah ada di keranjang pengguna, kuantitas akan diakumulasi (ditambahkan).

### C. CartController
Menyediakan endpoint terpisah untuk guest dan user terautentikasi:

**Guest Endpoints (Mewajibkan Header `X-Guest-ID`):**
- `GET /api/v1/cart/guest`
- `POST /api/v1/cart/guest`
- `PUT /api/v1/cart/guest/{cartItemId}`
- `DELETE /api/v1/cart/guest/{cartItemId}`
- `DELETE /api/v1/cart/guest` (Clear cart)

**User Endpoints (Mewajibkan Bearer Token):**
- `GET /api/v1/cart`
- `POST /api/v1/cart`
- `PUT /api/v1/cart/{cartItemId}`
- `DELETE /api/v1/cart/{cartItemId}`
- `DELETE /api/v1/cart` (Clear cart)
- `POST /api/v1/cart/sync` (Sinkronisasi saat login)

Semua response standar menggunakan struktur `ApiResponse.success(internalCode, message, data)`.

---

## 3️⃣ Daftar File yang Dimodifikasi / Ditambahkan

| # | File | Tipe Perubahan |
|---|------|---------------|
| 1 | `db/migration/V20260423120000__create_cart_items_table.sql` | ✨ **Baru** — DDL `CartItems` |
| 2 | `entity/CartItem.java` | ✨ **Baru** — Entity Database |
| 3 | `repository/CartItemRepository.java` | ✨ **Baru** — Data Access |
| 4 | `dto/CartItemDTO.java` | ✨ **Baru** — Output DTO |
| 5 | `dto/CartRequestDTO.java` | ✨ **Baru** — Input DTO |
| 6 | `dto/CartSyncRequestDTO.java` | ✨ **Baru** — Sync DTO |
| 7 | `service/CartService.java` | ✨ **Baru** — Logika Bisnis Redis & DB |
| 8 | `controller/CartController.java` | ✨ **Baru** — REST Endpoints |

---

## ⚠️ Catatan untuk Fase Selanjutnya

| # | Item | Prioritas | Keterangan |
|---|------|:---------:|------------|
| 1 | **Integrasi Frontend Context** | 🔴 High | `CartContext.jsx` di frontend saat ini masih menyimpan cart di local storage. Harus diubah agar menggunakan endpoint `/api/v1/cart`. |
| 2 | **Sinkronisasi Otomatis saat Login** | 🔴 High | Saat frontend mengeksekusi fungsi login, perlu dikirimkan request ke `POST /api/v1/cart/sync` dengan membawa data dari local guest cart. |
| 3 | **Fase 4: Payment & Tracking** | 🟡 Medium | Fase berikutnya akan mencakup pembuatan pesanan berdasarkan isi keranjang ini. |

---

*Dokumen ini adalah laporan eksekusi Fase 3 dari Rundown Pengembangan Otaku E-Commerce.*  
*Fase berikutnya: Fase 4 — Sistem Pembayaran & Order Tracking.*
