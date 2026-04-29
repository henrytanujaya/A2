# Plan Integrasi Binderbyte (Logistik & Tracking)

## 1. Tujuan
Menggunakan API **Binderbyte** untuk otomatisasi pencarian lokasi, kalkulasi biaya pengiriman real-time, dan pelacakan paket (tracking).

## 2. Fitur yang Diintegrasikan

### A. Cek Ongkos Kirim (Cost Order)
1. **API Endpoint**: `/v1/cost` (Binderbyte).
2. **Logic**:
   - Di `ShippingService.java`, ganti kalkulasi manual dengan request ke Binderbyte.
   - Input: `origin` (jakarta utara), `destination` (Nama Kota/Kecamatan User), `weight`, `courier`.
   - Output: List layanan kurir (REG, OKE, YES) beserta harga dan estimasi sampai.

### B. Pencarian Area (Lokasi)
1. **API Endpoint**: `/v1/list/city` atau `/v1/list/subdistrict`.
2. **Logic**:
   - Ganti data hardcoded di `ShippingService.searchAreas`.
   - Implementasikan caching (Redis) untuk data kota/kecamatan karena data ini jarang berubah, guna menghemat kuota API Binderbyte.

### C. Tracking Order (Lacak Resi)
1. **API Endpoint**: `/v1/track`.
2. **Logic**:
   - Optimalkan `TrackingService.trackPackage`.
   - Simpan hasil tracking terakhir di database/cache untuk menghindari request berulang ke API untuk resi yang sama dalam waktu singkat.
   - Mapping status dari Binderbyte (DELIVERED, ON PROCESS, dll) ke status internal aplikasi.

### D. Manajemen Resi (Pembuatan Resi)
*Catatan: Binderbyte adalah API tracking, bukan aggregator pengiriman (seperti Biteship yang bisa generate AWB). Namun, plan ini mencakup alur manajemennya:*
1. **Flow Admin**: Admin memasukkan nomor resi yang didapat dari kurir ke sistem.
2. **Backend**: Memvalidasi nomor resi tersebut ke API Binderbyte. Jika valid, status order berubah menjadi `Shipped`.
3. **Notifikasi**: Kirim email/notifikasi ke user bahwa paket dalam pengiriman dengan nomor resi tersebut.

---

## 3. Langkah-Langkah Teknis (Backend)

### A. Konfigurasi
- API Key Binderbyte sudah disiapkan di `application.properties`.
- Gunakan `RestTemplate` yang sudah ada di `TrackingService`.

### B. Refactoring `ShippingService.java`
- Hapus array `areaData` yang hardcoded.
- Buat metode privat `callBinderbyteAPI(endpoint, params)`.
- Implementasikan fallback logic: Jika API Binderbyte down, gunakan data minimal yang tersimpan di database lokal.

---

## 4. Langkah-Langkah Teknis (Frontend)

### A. Komponen Alamat
- Gunakan *Autocomplete/Select* yang memanggil API search area secara asinkron (Debounced search).
- Simpan `city_id` atau `subdistrict_id` dari Binderbyte ke data alamat user.

### B. Halaman Tracking
- Tampilan timeline tracking yang lebih visual menggunakan data dari `TrackingResponseDTO`.

---

## 5. Keamanan & Efisiensi
- **Rate Limiting**: Pastikan user tidak bisa membombardir request tracking (misal: max 1 request per 10 menit per resi).
- **Caching**: Sangat penting untuk data "List Kota" dan "Cek Ongkir" (cache per 24 jam).

---

## 6. Apa yang Dibutuhkan untuk Menjalankan Rencana Ini
1. **API Key Binderbyte**: Akses ke dashboard Binderbyte untuk mendapatkan key.
2. **Redis Server**: Berfungsi untuk caching data area guna efisiensi kuota API.
3. **Frontend Dependency**: `react-select` atau library serupa untuk pencarian area yang user-friendly.
4. **Backend Setup**: `RestTemplate` atau `WebClient` yang terkonfigurasi untuk timeout dan retry logic.

