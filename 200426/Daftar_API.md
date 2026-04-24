# Daftar Lengkap Endpoint API (Postman-Ready Catalog)

Dokumen ini berisi daftar lengkap semua endpoint yang sudah tersedia di backend beserta struktur **Payload JSON** yang dibutuhkan. Kamu bisa menyalin seluruh blok JSON langsung ke *Body (raw)* Postman.

> **💡 PERHATIAN PENTING:** 
> - Semua request bertanda `(Butuh Token)` wajib menyertakan Authorization Header di Postman: `Bearer <token_anda>`
> - Gunakan role yang sesuai (`Admin` atau `Customer`), karena mengakses endpoint yang tidak diizinkan akan mereturn `403 Forbidden`.

---

## 🔐 1. Authentication (Auth)

### Login User 
`POST /api/v1/auth/login`
```json
{
    "email": "admin@otaku.com",
    "password": "Password123!"
}
```

### Registrasi User Baru
`POST /api/v1/auth/register`
```json
{
    "name": "Budi Pengguna Baru",
    "email": "budi.baru@gmail.com",
    "password": "PasswordSuperKuat!12"
}
```

### Refresh Token 
`POST /api/v1/auth/refresh`
```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Logout *(Butuh Token)*
`POST /api/v1/auth/logout`
- **Body:** Kosongkan / `none`.

---

## 🛍️ 2. Products (Katalog Standar)

### Daftar Produk
`GET /api/v1/products`
- **Tipe:** Public 

### Detail Produk
`GET /api/v1/products/{id}`
- **Tipe:** Public 

### Tambah Produk Baru *(Admin Only)*
`POST /api/v1/products`
```json
{
    "category": "ActionFigure",
    "name": "Nendoroid Gojo Satoru",
    "description": "Nendoroid original dari Jujutsu Kaisen.",
    "price": 750000.00,
    "stockQuantity": 15,
    "imageUrl": "https://url-gambar.com/gojo.jpg"
}
```

### Update Produk *(Admin Only)*
`PUT /api/v1/products/{id}`
```json
{
    "category": "ActionFigure",
    "name": "Nendoroid Gojo Satoru (Update)",
    "description": "Nendoroid original dengan wajah ganti.",
    "price": 800000.00,
    "stockQuantity": 20,
    "imageUrl": "https://url-gambar.com/gojo2.jpg"
}
```

### Update Stok Cepat *(Admin Only)*
`PATCH /api/v1/products/{id}/stock?quantity=50`
- **Tipe:** Parameter query url langsung (Tidak butuh body JSON).

### Hapus Produk *(Admin Only)*
`DELETE /api/v1/products/{id}`
- **Tipe:** Tanpa Body.

---

## 🛒 3. Standard Orders (Pesanan Biasa)

### Buat Order Baru *(Customer)*
`POST /api/v1/orders`
```json
{
    "items": [
        {
            "productId": 1,
            "quantity": 2
        }
    ],
    "discountCode": "PROMOANIME2026"  
}
```
*(Catatan: `discountCode` opsional, hapus key ini dari JSON jika tidak memakai promo)*

### Lihat Semua Order Saya *(Customer)*
`GET /api/v1/orders`

### Lihat Detail Order Spesifik *(Customer)*
`GET /api/v1/orders/{id}`

---

## 🎨 4. Custom Orders (Request Figur Kustom)

### Buat Request Baru *(Customer)*
`POST /api/v1/custom-orders`
```json
{
    "serviceType": "AF_3D",
    "imageReferenceUrl": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    "configurationJson": "{\"tinggi\": \"15cm\", \"warnaDasar\": \"Merah\"}"
}
```

### Lihat Riwayat Custom Order Saya *(Customer)*
`GET /api/v1/custom-orders`

### Cek Detail Custom Order Spesifik *(Customer)*
`GET /api/v1/custom-orders/{id}`

---

## 📷 5. Image Uploader

Untuk endpoint ini di Postman, **JANGAN gunakan tipe Raw JSON**.  
Gunakan tipe HTTP: `form-data`.
1. Ubah tab `Body` menjadi `form-data`
2. Isi Key dengan nama: `file`
3. Hover ke kotak Key, lalu ubah tipe dari `Text` menjadi `File`
4. Pilih gambar di bagian Value.

### Upload Referensi Kostum *(Customer/Admin)*
`POST /api/v1/upload/outfit-reference`

### Upload Referensi Pose/Figur *(Customer/Admin)*
`POST /api/v1/upload/figure-reference`

---

## 💸 6. Discounts (Kupon Diskon)

### Cek Kupon *(Customer)*
`GET /api/v1/discounts/validate?code=PROMOANIME2026`

### Buat Promo Baru *(Admin Only)*
`POST /api/v1/discounts`
```json
{
    "code": "SUPEROTAKU50",
    "discountPercentage": 50.00,
    "maxUses": 100,
    "validUntil": "2026-12-31T23:59:59"
}
```

### Update Promo *(Admin Only)*
`PUT /api/v1/discounts/{id}`
```json
{
    "code": "SUPEROTAKU50",
    "discountPercentage": 75.00,
    "maxUses": 50,
    "validUntil": "2027-01-01T00:00:00"
}
```

### Hapus Promo *(Admin Only)*
`DELETE /api/v1/discounts/{id}`

---

## 👑 7. Admin Dashboard - Manajemen User
*Semua Endpoint ini HANYA BISA diakses Role Admin*

### List Semua User
`GET /api/v1/admin/users`

### Detail User
`GET /api/v1/admin/users/{id}`

### Ubah Jabatan User
`PATCH /api/v1/admin/users/{id}/role?role=Admin`
*(Contoh Parameter Query: `role=Admin` atau `role=Customer`)*

### Force Logout (Tendang user aktif)
`POST /api/v1/admin/users/{id}/force-logout`

### Hapus/Banned User
`DELETE /api/v1/admin/users/{id}`

---

## 👑 8. Admin Dashboard - Manajemen Pesanan Biasa
*Semua Endpoint ini HANYA BISA diakses Role Admin*

### Lihat Semua Order Masuk
`GET /api/v1/admin/orders`

### Detail Order
`GET /api/v1/admin/orders/{id}`

### Update Status Pengiriman
`PATCH /api/v1/admin/orders/{id}/status?status=Shipped`
*(Tersedia: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)*

---

## 👑 9. Admin Dashboard - Manajemen Pesanan Kustom
*Semua Endpoint ini HANYA BISA diakses Role Admin*

### Lihat Antrean Pesanan Kustom
`GET /api/v1/admin/custom-orders`

### Tetapkan Harga Setelah Review
`PATCH /api/v1/admin/custom-orders/{id}/price?price=1500000.00`
*(Hanya URL Query param)*

### Update Proses Pekerjaan
`PATCH /api/v1/admin/custom-orders/{id}/status?status=Printing`
*(Tersedia: `PendingReview`, `AwaitingPayment`, `Printing`, `Painting`, `Shipped`, dll)*
