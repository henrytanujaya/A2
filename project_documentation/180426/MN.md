# Daftar Kekurangan Backend Menuju Pra-Produksi (Live Deployment)

Dokumen ini melacak area mana saja di dalam lingkungan kode *Backend* Spring Boot saat ini yang harus dipoles atau diselesaikan sebelum aplikasi Otaku E-Commerce benar-benar aman dan siap untuk dideploy ke *Internet* sungguhan.

---

## 1. Keamanan Hardcoded (Variabel Konfigurasi & Kredensial)
*   **Database Credentials:** Saat ini konfigurasi database (`application.yml`) masih menuliskan rahasia server SQL yang bersifat murni lokal (`satpam` atau `password`). Di versi Prod, kredensial ini wajib diganti dengan jembatan variabel otomatis (*Environment Configuration*) seperti `${DB_URL}` atau diisolasi menggunakan profil konfigurasi lain (e.g. `application-prod.yml`).
*   **Kunci JWT (Secret Key):** Hal terlarang lainnya adalah masih adanya *string terekspos* `SECRET_KEY_STRING` di kode `JwtUtil.java`. Siapa pun yang bisa melihat sistem kode berpotensi mencetak ribuan akses palsu secara bebas. Kunci dekripsi tersebut harus diambil langsung dari dalam rahasia peladen luar dengan pola `@Value("${jwt.secret}")`.

## 2. Pagination Katalog Produk (Mencegah Overload)
*   Skema pengambilan data saat ini (`productService.getAllProducts()`) langsung memerintahkan pangkalan data (DB) SQL Server untuk meraup **semua** data produk yang ada sekaligus ke dalam memori aplikasi.
*   Jika toko akhirnya memiliki ukuran yang masif di hari pertama perilisan, operasi ini akan instan membunuh kapasitas server / mengakibatkan respon browser memakan waktu lama. Kita membutuhkan injeksi tipe antarmuka Spring `Pageable` dan fitur limitasi halaman.

## 3. Eksternalisasi Unggahan File (Object Storage)
*   File aset referensi Custom Desain dan Bukti File yang dikirim melalui `ImageUploadController` di dalam struktur saat ini baru diarahkan sebagai tangkapan sementara (`mock`).
*   Infrastruktur Deployment standar pada platform Container/Cloud pada umumnya adalah mode **Ephemeral** (Terkunci & Direset). Penyimpanan lokal server akan sirna sewaktu server dimatikan. Unggahan file *Customer* harus dapat dihubungkan ke awan eksternal semacam  **S3 Buckets** eksklusif.

## 4. Validasi Objek Otomatis Berbasis Anotasi
*   Aplikasi Spring Boot harus menerapkan *Defense in Depth*. Di luar dari *Custom Exception* di sisi Controller, ada baiknya memasang penjaga gerbang standar milik Maven (`spring-boot-starter-validation`).
*   Dengan menambah perlindungan atribut seperti `@NotBlank`, `@Email` dan pengetatan tipe data di dalam paket model `dto/`, maka anomali-anomali JSON dari pihak klien jahat (termasuk ukuran teks raksasa) bisa dicegat mentah-mentah agar memori layanan bisnis tidak rusak.

## 5. Kontainerisasi (Standardisasi Portabilitas)
*   Menghindari masalah lawas *"It Works On My Machine"* alias Kode berjalan di komputer lokal namun macet total di Server (*Linux*). Modul Back-End ini akan secara krusial terbantu dengan perakitan naskah tunggal **`Dockerfile`**. Menjadikan proyek Java secara keseluruhan bisa disetir mandiri dari server dan arsitektur manapun di masa depan dengan jaminan kompatibilitas solid.

## 6. Kelengkapan Rute Operasional Ekstra
*   Setiap pelanggan perlu memiliki visibilitas transaksinya (`GET /api/v1/orders/me`).
*   Menyediakan titik-titik validasi Webhook atau konfirmasi pelunasan dengan Payment Gateway.

---

**Status Prioritas Aksi Lanjut:** Sangat Disarankan untuk memulai perbaikan *Configuration Hardcoding* & *Spring Validation* sebagai transisi pertama.
