# Plan: Penyimpanan Desain Custom Apparel

Analisis menu Custom Apparel menunjukkan bahwa sistem saat ini hanya menyimpan gambar aset yang diunggah oleh pelanggan dan konfigurasi posisi (JSON). Sistem belum menyimpan hasil akhir desain (mockup yang sudah digabungkan).

## Tujuan
Agar admin dapat melihat hasil desain akhir yang diinginkan pelanggan secara visual tanpa harus merekonstruksi dari koordinat JSON.

## Rencana Implementasi

### 1. Frontend (CustomApparel.jsx)
- **Library Baru**: Instal `html2canvas` untuk mengambil tangkapan layar (screenshot) dari area mockup.
- **Modifikasi `handleAddToCart`**:
    - Sebelum mengunggah aset ke Cloudinary, ambil screenshot elemen `.mockup-area` menggunakan `html2canvas`.
    - Unggah **dua** gambar ke Cloudinary:
        1. `source_asset`: Gambar transparan yang diunggah user.
        2. `design_preview`: Gambar mockup lengkap (kaos + desain di atasnya).
    - Kirim kedua URL ini ke backend.

### 2. Backend (CustomOrder & CartItem)
- Tambahkan field `previewImageUrl` pada entity `CustomOrder`.
- Pastikan saat `CartItem` dibuat dari `CustomOrder`, field `imageUrl` diisi dengan `previewImageUrl` agar pelanggan dapat melihat desain mereka di keranjang.

### 3. Workflow Data
1. User upload desain -> AI hapus background -> User atur posisi di mockup.
2. User klik "Masukkan Keranjang".
3. Frontend capture div mockup -> Upload ke Cloudinary -> Dapat URL Preview.
4. Frontend upload original asset -> Dapat URL Asset.
5. Simpan CustomOrder dengan `imageReferenceUrl` (Asset) dan `configurationJson` (JSON), serta `previewImageUrl` (Preview).
6. Cart menampilkan `previewImageUrl`.

---

## 4. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **Library `html2canvas`**: Tambahkan via npm/yarn di proyek frontend.
2. **Cloudinary Setup**: Pastikan upload preset `otaku_ecommerce` sudah benar untuk folder `otaku/apparel-designs`.
3. **Database Update**: Migrasi field baru `preview_image_url` pada tabel `CustomOrders`.
4. **CSS Adjustment**: Pastikan area mockup memiliki ID/Class yang unik agar mudah di-capture tanpa elemen UI yang tidak perlu (seperti button zoom).

