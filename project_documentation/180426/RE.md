# Dokumentasi Standar Kode Respons & Error (Otaku E-Commerce)

Dokumen ini memuat standarisasi kode *response* sukses (HTTP 200/201) dan kode *error* untuk seluruh aliran logika bisnis (Business Logic) yang terjadi di dalam Spring Boot backend.
Penggunaan kode internal ini mempermudah sistem _Frontend_ (React JS) untuk menelusuri secara presisi jenis masalah yang terjadi.

## Struktur `ApiResponse`
Apabila standar ini disetujui, kita akan mengembangkan DTO `ApiResponse.java` menjadi seperti berikut:
```json
{
    "success": true/false,
    "internalCode": "OTK-XXXX",
    "message": "Deskripsi Pesan",
    "data": { ... } // (bila ada)
}
```

---

## 1. Kode Sukses Respons Aplikasi (SUCCESS CODES)
Kode ini berlaku ketika operasi logika bisnis berhasil menyentuh persentase penyelesaian 100%.

| Internal Code | HTTP Status | Kategori | Standard Message (Contoh) | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **OTK-2000** | 200 OK | `General` | Operasi berhasil / Data ditemukan | Default untuk operasi `GET`. |
| **OTK-2010** | 201 Created | `General` | Data baru berhasil ditambahkan | Default penciptaan entitas `POST`. |
| **OTK-2001** | 200 OK | `Auth` | Login berhasil, otentikasi dijaga | Sukses Login dari JWT Filter. |
| **OTK-2011** | 201 Created | `Auth` | Registrasi akun baru berhasil | Sukses untuk klien pertama kali Join. |
| **OTK-2002** | 200 OK | `Discount` | Kupon Diskon Berhasil Diaplikasikan | Membantu frontend meng-kalkulasi keranjang. |
| **OTK-2012** | 201 Created | `Checkout` | Checkout transaksi berhasil dibuat | Invoice (Order/OrderItem) berhasil meresap ke SQL Server. |

---

## 2. Kode Error Logika Bisnis (BUSINESS LOGIC CODES)
*Error Business* berbeda dari error server murni (misal: mesin mati atau kabel putus). Ini adalah hambatan spesifik berdasarkan validasi toko kita (e.g. Stok habis, Kupon salah).

### A. Otentikasi dan Otorisasi
| Internal Code | HTTP Status | Standard Message (Contoh) | Kondisi (Pemicu) |
| :--- | :--- | :--- | :--- |
| **OTK-4001** | 400 Bad Request | Email atau Password salah | User memasukkan sandi yang salah ketika `login()`. |
| **OTK-4002** | 400 Bad Request | Format Email tidak valid | Validasi String tipe *Email* gagal di DTO. |
| **OTK-4011** | 401 Unauthorized | Token Akses Kadaluwarsa / Ilegal | JWT dicegat atau tidak dikirim sewaktu akses `orders`. |
| **OTK-4031** | 403 Forbidden | Hak Akses Dilarang | User biasa mencoba mengakses endpoint milik *Role Admin*. |
| **OTK-4041** | 404 Not Found | Akun User Tidak Ditemukan | Email belum terdaftar pada *Database*. |

### B. Katalog Produk & Manajemen Custom 3D
| Internal Code | HTTP Status | Standard Message (Contoh) | Kondisi (Pemicu) |
| :--- | :--- | :--- | :--- |
| **OTK-4042** | 404 Not Found | Item Katalog Tidak Ditemukan | ID Produk pada Keranjang tidak eksis di *Products Table*. |
| **OTK-4043** | 404 Not Found | Reference Image Custom 3D Hilang | Validasi pengecekan tautan `imageReferenceUrl` gagal. |
| **OTK-4091** | 409 Conflict | Stok Item Habis / Kurang | `quantity` Cart lebih besar dibandingkan `StockQuantity` Produk. |

### C. Alur Pemesanan & Diskon (Keranjang)
| Internal Code | HTTP Status | Standard Message (Contoh) | Kondisi (Pemicu) |
| :--- | :--- | :--- | :--- |
| **OTK-4044** | 404 Not Found | Kode Kupon Tidak Berlaku | Pelanggan memakai "DISC300K" tetapi kode sudah dihapus/tidak disahkan. |
| **OTK-4092** | 400 Bad Request | Syarat Kategori Diskon Gagal | Kasus pelanggan memakai kupon "OUTFITFEST" (Khusus Custom Outfit) tapi hanya beli *Manga*. |
| **OTK-4003** | 400 Bad Request | Keranjang Kosong | Percobaan Checkout tanpa menyertakan satupun `OrderItem`. |

---

## 3. Sistem Error Fatal (INTERNAL SERVER ERRORS)
Error murni kegagalan jaringan atau sintaks (yang akan tertangkap secara default oleh **Exceptions.class** Handler).

| Internal Code | HTTP Status | Standard Message (Contoh) | Kondisi (Pemicu) |
| :--- | :--- | :--- | :--- |
| **OTK-5000** | 500 Internal Error | Terjadi Kegagalan Sistem Internal | *Null Pointer Exception* / Kesalahan Skrip. |
| **OTK-5001** | 503 Unavailable | Kegagalan Menghubungi Target SQL | SQL Server sedang *down*, ditangkap sewaktu `repository.save()`. |
| **OTK-5002** | 500 Internal Error | Penulisan Berkas Gagal (Image Upload) | Controller gagal menulis payload dari sistem file Custom Outfit/3D. |


----
### Catatan Lanjutan Integrasi:
Jika model ini disetujui, kami hanya perlu menanamkan struktur enum `ResponseConstants` atau menambah parameter `internalCode` ke dalam pengecualian (Exceptions) dan kelas pembungkus (`ApiResponse`) yang baru saja disiapkan.
