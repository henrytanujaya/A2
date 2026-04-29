# Plan: AI-Powered Generative 3D Figure (Tripo AI Style)

Analisis menu 3D Figure menunjukkan kebutuhan untuk beralih dari sekadar "Acrylic Cutout" menjadi "True 3D Mesh" yang dihasilkan oleh AI, serupa dengan teknologi pada `studio.tripo3d.ai`.

## Tujuan
Menghasilkan model 3D utuh (geometry & texture) dari satu foto unggahan customer menggunakan AI Generative, menampilkannya secara interaktif, dan menyimpan aset 3D tersebut untuk pesanan.

## Rencana Implementasi

### 1. Integrasi API AI 3D (Backend & Frontend)
- **Service Integration**: Mengintegrasikan API **Tripo AI** (Image-to-Model) untuk menghasilkan mesh 3D dari unggahan user.
- **Workflow Generasi**:
    1. User mengunggah foto.
    2. Backend mengirim foto ke API AI untuk proses "Image-to-3D".
    3. Karena proses ini memakan waktu (30-60 detik), implementasikan status **"Generating..."** di frontend.
    4. Backend menerima callback/webhook atau melakukan polling hingga file `.glb` (3D model) siap.

### 2. Visualisasi 3D Interaktif (Custom3D.jsx)
- **GLTF Loader**: Mengganti `PlaneGeometry` dengan `GLTFLoader` untuk memuat model `.glb` hasil generasi AI.
- **Environment & Material**: 
    - Menggunakan `Environment` HDR agar model 3D terlihat realistis dengan pantulan cahaya yang dinamis.
    - Menambahkan kontrol rotasi, zoom, dan pan yang lebih halus menggunakan `OrbitControls`.

### 3. Penyimpanan Aset & Render
- **3D Model Storage**: Menyimpan file `.glb` yang dihasilkan ke Cloudinary atau storage internal agar bisa diunduh kembali oleh Admin untuk keperluan cetak 3D.
- **Capture Render**: Tetap menggunakan fitur screenshot canvas untuk menyimpan gambar pratinjau (thumbnail) di keranjang belanja dan invoice.
- **Modifikasi `CustomOrder`**:
    - Tambahkan field `modelFileUrl` untuk menyimpan link file `.glb`.
    - Tambahkan field `renderImageUrl` untuk menyimpan screenshot preview.

### 4. Keunggulan (Tripo Style)
- **High Fidelity**: Hasil bukan lagi kepingan datar, melainkan objek 3D bervolume yang bisa dilihat dari segala sudut.
- **WOW Factor**: Memberikan pengalaman premium kepada customer yang ingin melihat foto mereka "hidup" dalam bentuk 3D.
- **Siap Cetak**: File `.glb` hasil AI bisa dikonversi lebih lanjut oleh Admin menjadi format siap cetak 3D (seperti `.stl`).

---

## 5. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **API Key Tripo AI**: Sudah tersedia (`tsk_a0kMT8...`).
2. **Library `@react-three/drei`**: Untuk akses `useGLTF` dan `Environment` yang memudahkan pengelolaan model 3D.
3. **Backend Storage**: Kapasitas storage (misal: S3 atau Cloudinary) yang mencukupi untuk menyimpan file `.glb` yang ukurannya lebih besar dibanding gambar biasa.
4. **Webhook Handler**: Endpoint di backend untuk menerima notifikasi saat proses generasi 3D oleh AI selesai.


