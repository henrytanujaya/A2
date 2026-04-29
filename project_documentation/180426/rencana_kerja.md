# Rencana Kerja: Aplikasi E-Commerce Kolektor & Hobi

Aplikasi web e-commerce ini difokuskan pada penjualan barang-barang premium terkait kultur pop Jepang, yaitu: Action Figure, Custom Outfit (aksesoris/pakaian untuk figure), Komik Jepang (Manga), dan Blu-ray DVD Anime/Movie. Aplikasi ini dirancang untuk memiliki tampilan visual yang memukau (premium, modern, dan dinamis) demi memberikan pengalaman terbaik bagi penggunanya.

## 1. Fitur Utama
- **Kustomisasi & Personalisasi (Custom 3D & Outfit):**
  - **Action Figure (AF):** Fitur *Upload Image* (unggah gambar) yang memungkinkan pengguna mengirimkan referensi gambar 2D untuk dicetak menjadi *custom 3D printing* figure.
  - **Custom Outfit:** Modul khusus yang memungkinkan pengguna mengunggah gambar desain mereka sendiri. Gambar tersebut dapat disimulasikan dan ditempelkan langsung (*Live Preview*) pada *mockup* pakaian (atasan dan bawahan) melalui editor visual bawaan.
- **Katalog Produk Terkategorisasi:** Menampilkan produk dalam 4 kategori khusus dengan sistem pencarian dan filter yang mudah digunakan.
- **Sistem Diskon Terpadu (NEW):** Fitur penetapan harga potong (diskon / kode promo) yang dapat dikustomisasi pengaplikasiannya, mencakup:
  - Pembelian produk inventori biasa / reguler.
  - Pemesanan jasa kustomisasi *Outfit*.
  - Pemesanan jasa *Custom 3D Action Figure*.
- **Detail Produk Menarik:** Menampilkan gambar dengan resolusi tinggi, deskripsi, harga, status stok, dan variasi.
- **Keranjang Belanja & Checkout:** Sistem keranjang yang intuitif untuk mengkalkulasi total barang, pajak, **potongan diskon**, dan harga akhir dengan tata cara checkout yang mulus.
- **Sistem Akun & Dasbor:** Sistem bagi pengguna untuk mendaftar, serta Dasbor Admin untuk manipulasi katalog dan diskon.

## 2. Struktur Teknologi (Tech Stack)
Mempertimbangkan panduan perancangan desain tingkat tinggi:
- **Frontend Framework:** Vite + React.js 
- **Desain & Gaya (Styling):** Vanilla CSS dengan arsitektur variabel CSS terstruktur (estetika mode gelap/elegan, transisi halus, tipografi premium).
- **Mockup & Image Processing:** Integrasi HTML5 Canvas API (bersama pustaka semacam `react-konva` atau `fabric.js`) untuk menangani unggahan dan *live render* gambar kustom.
- **Manajemen State (Global):** Context API atau Zustand untuk state kalkulasi keranjang (menyimpan state diskon yang aktif).
- **Data Dasar:** Prototipe menggunakan Mock JSON Data (produk dan validasi promo) sebelum tersambung ke backend nyata.

## 3. Fase Pengembangan

### Fase 1: Persiapan Proyek & Desain Sistem
- Inisialisasi basis proyek Vite React secara bersih.
- Menetapkan gaya global (*Design Tokens*) yang dimasukkan ke `index.css`.
- Membangun struktur tata letak halaman utama.

### Fase 2: Pembuatan Komponen Inti & Modul Kustomisasi
- Mendesain Navigation bar, Footer, dan komponen Button/Card.
- **Pengembangan Alat Mockup (*Customizer*):** Membuat antarmuka area kanvas untuk unggahan (*dropzone*) dan pratinjau gambar pada mockup baju.
- Merancang *form* pesanan unggah banyak gambar referensi untuk 3D Printing AF.

### Fase 3: Pengembangan Halaman & Routing
- Menyesuaikan routing internal (`react-router-dom`).
- Menyusun **Home Page** dinamis, halaman daftar produk, detail produk, dan integrasi modul mockup.

### Fase 4: Fungsi Keranjang, Promo, dan Checkout
- Mengimplementasikan `Add to Cart`, menyertakan file 3D AF atau koordinat desain outfit yang dipesan pengguna.
- **Logika Diskon:** Mengintegrasikan form input "*Kode Voucher*" di halaman keranjang dan sistem potongan harga "*Harga Coret*" untuk promo reguler. Menyesuaikan logika aritmatika biaya keranjang.
- Merancang halaman ringkasan Checkout.

### Fase 5: Poles Akhir dan Uji Coba
- Menambahkan gambar-gambar estetik premium.
- Eksekusi simulasi seluruh aliran *(flow)* pengguna: dari melihat produk, mengkustomisasi fitur, memasukkan promo diskon, hingga bayar.

---
*Dibuat oleh AI Assistant.*
