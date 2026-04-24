# Panduan Uji Coba Login dengan Postman

Dokumen ini berisi panduan dan kredensial untuk melakukan uji coba endpoint otentikasi login menggunakan **Postman**, lengkap dengan contoh request untuk 2 jenis role yang berbeda: `Admin` dan `Customer`.

---

## 📌 Konfigurasi Dasar Postman
Sebelum menggunakan data login di bawah ini, pastikan pengaturan Postman-mu sudah sesuai:

1. **Method:** `POST`
2. **URL Endpoint:** `http://localhost:8321/api/v1/auth/login`
3. **Headers:**
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body Tab:** Pilih `raw` lalu pilih format `JSON`.

---

## 🔑 1. Login sebagai Admin (Role: Admin)
Gunakan akun ini jika kamu ingin mengetes fitur-fitur yang dikhususkan untuk Administrator (misal: tambah produk, lihat semua order).

*Isi di kolom Body (raw JSON):*
```json
{
    "email": "admin@otaku.com",
    "password": "Password123!"
}
```

---

## 🔑 2. Login sebagai Customer (Role: Customer)
Gunakan akun ini untuk mensimulasikan login pengguna biasa / pembeli. Cocok untuk menguji checkout, upload gambar kustom, dll. *(Akun ini menggunakan sandi yang sudah kita perbarui di sesi sebelumnya).*

*Isi di kolom Body (raw JSON):*
```json
{
    "email": "budi@gmail.com",
    "password": "Password123!"
}
```

---

## ✅ Respons yang Diharapkan (Jika Berhasil)
Ketika kamu menekan tombol **Send** di Postman (dan server backend sedang dalam status running), kamu akan mendapatkan response persis seperti ini:

```json
{
    "success": true,
    "internalCode": "OTK-2001",
    "message": "Login berhasil",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
        "tokenType": "Bearer",
        "expiresIn": 900,
        "user": {
            "id": 1,
            "name": "Admin Otaku",
            "email": "admin@otaku.com",
            "role": "Admin",
            "createdAt": "2026-04-21T10:00:00"
        }
    },
    "timestamp": "2026-04-21T17:55:00.0000000"
}
```

**💡 Tips:**  
Simpan nilai teks dari `"accessToken"` tersebut. Kamu akan membutuhkannya untuk dimasukkan ke bagian tab **Authorization -> Bearer Token** di Postman saat ingin mengetes API lain yang diamankan (seperti API Create Product, dll).
