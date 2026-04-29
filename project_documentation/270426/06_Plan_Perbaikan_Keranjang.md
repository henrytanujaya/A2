# Plan: Perbaikan Tampilan Gambar di Keranjang

Analisis menu Cart menunjukkan adanya ketidaksinkronan antara penamaan properti di Frontend dan Backend yang menyebabkan gambar produk tidak muncul.

## Analisis Masalah
- **Frontend (Cart.jsx)**: Mencoba mengakses `item.image`.
- **Backend (CartItemDTO)**: Mengirimkan data dengan nama properti `imageUrl`.

## Rencana Perbaikan

### 1. Sinkronisasi Data (Frontend)
- Ubah referensi gambar di `Cart.jsx` dari `item.image` menjadi `item.imageUrl`.
- Lakukan hal yang sama pada komponen mini-cart atau summary jika ada.

### 2. Validasi Data (Backend)
- Pastikan `CartService` selalu mengisi field `imageUrl` baik untuk produk reguler maupun custom order.
- Khusus untuk Custom Order, `imageUrl` harus diisi dengan `previewImageUrl` atau `renderImageUrl` (sesuai plan Apparel/3D sebelumnya) agar user melihat hasil desain mereka di keranjang, bukan sekadar logo placeholder.

### 3. Fallback Image
- Tambahkan placeholder image yang lebih premium jika `imageUrl` kosong (misal: gambar siluet produk dengan brand logo) untuk menjaga estetika UI.

---

## 4. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **Frontend Refactoring**: Update pada file `Cart.jsx` dan `CartContext.jsx` untuk memastikan konsistensi penggunaan field `imageUrl`.
2. **Backend DTO Sync**: Pastikan `CartItemDTO` di Java memiliki getter/setter yang benar untuk `imageUrl` dan ter-serialize dengan benar ke JSON.
3. **Asset Placeholder**: File gambar placeholder (JPG/PNG) yang disimpan di folder `assets` frontend.

