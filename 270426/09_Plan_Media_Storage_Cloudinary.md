# Plan: Integrasi Cloudinary untuk Snapshot & Render

Berdasarkan analisis kebutuhan penyimpanan desain kustom, Cloudinary akan digunakan sebagai pusat penyimpanan aset digital yang dihasilkan oleh pelanggan (Snapshot desain baju dan Render 3D).

## 1. Tujuan
Menyediakan penyimpanan yang persisten, aman, dan berkinerja tinggi untuk gambar-gambar hasil kustomisasi pelanggan agar dapat diakses oleh Admin untuk proses produksi.

## 2. Strategi Penyimpanan Folder
Untuk menjaga kerapihan data, penyimpanan di Cloudinary akan dibagi menjadi beberapa folder:
- `otaku/products/`: Foto produk asli dari katalog.
- `otaku/apparel-designs/`: Hasil capture/snapshot desain dari menu Custom Apparel.
- `otaku/3d-models/`: Hasil model 3D (.glb) dan render preview dari menu 3D Figure.
- `otaku/temp/`: File sementara saat proses upload sebelum dipindahkan.

## 3. Rencana Implementasi

### A. Frontend (Upload Direct/Indirect)
- **Direct Upload**: Frontend mengirimkan gambar langsung ke Cloudinary menggunakan *Unsigned Upload Preset* untuk mengurangi beban server backend.
- **Hasil**: Frontend menerima URL gambar (misal: `https://res.cloudinary.com/...`) dan mengirimkan URL tersebut ke backend untuk disimpan dalam database `CustomOrder`.

### B. Backend (Cloudinary Service)
- Memperbarui `CloudinaryUploadService.java` agar benar-benar terhubung ke API Cloudinary (saat ini masih menyimpan lokal).
- Menggunakan library `cloudinary-http44` untuk integrasi Java.

### C. Optimasi Gambar
- Menggunakan fitur **Auto-format (f_auto)** dan **Auto-quality (q_auto)** dari Cloudinary untuk memastikan gambar snapshot yang dilihat Admin tetap tajam namun berukuran kecil (hemat bandwidth).

## 4. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **Cloudinary API Credentials**: Sudah tersedia (`dvyuk3imn`, dll).
2. **Upload Preset**: Menggunakan preset `otaku_ecommerce` (Signed).
3. **Library Cloudinary**: `com.cloudinary:cloudinary-http44` ditambahkan ke `pom.xml`.
4. **Environment Variables**: Penambahan key Cloudinary ke dalam file `.env`.
