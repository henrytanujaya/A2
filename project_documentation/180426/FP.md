# Frontend Master Plan (Otaku Store V1.0)
*Status: Perancangan Lanjutan (React JS + Vite - Tema Kitsune Sakura)*

## 1. Kesesuaian Teknologi & Rekomendasi
Pilihan **React JS + Vite** difinalisasikan sebagai *core framework*. Kecepatan *hot-module replacement* sangat krusial saat merakit komponen visual berat seperti 3D model.

**Tech-Stack Tambahan yang Disarankan:**
*   **Routing:** `react-router-dom` (Pindah halaman mulus berformat *Single Page Application*).
*   **Animasi Tampilan:** `framer-motion` (Untuk animasi kelopak jatuh dan transisi *fading/sliding* elegan antar halaman).
*   **State Management:** `zustand` (Manajemen Keranjang Belanja Global & Status Login User).
*   **Pemanggilan API:** `axios` dengan *interceptor* otomatis (menyemutkan JWT Token).
*   **Mesin 3D:** `@react-three/fiber` dan `@react-three/drei`.

---

## 2. Tema & Desain Visual (Aesthetics)
Estetika inti website akan mengadopsi aura **"Elegant Dark Matsuri" (Festival Kegelapan & Yokai)**. Ini diciptakan secara spesifik untuk audiens yang mencintai kultur jejepangan misterius namun tetap premium.
*   **Warna Dasar Latar (Background):** Hitam Pekat / *Jet Black* (`#0A0A0A`) dikombinasikan dengan Abu-abu Arang (`#1A1A1A`) agar mata audiens tidak lelah.
*   **Warna Aksen Dominan:** **Merah Crimson (`#D32F2F`)** dan **Merah Sakura (`#FF7597`)** pada tombol utama dan tautan, mencerminkan kekuatan dan keindahan bunga sakura.
*   **Elemen Visual Spesifik:**
    *   **Kitsune & Topeng:** Menggunakan Topeng Kitsune (Rubah Berekor Sembilan) sebagai logo utama, motif *loading screen*, atau avatar default pengguna.
    *   **Sakura Berjatuhan:** Implementasi animasi partikel ringan (menggunakan modul *tsParticles* atau *Framer Motion*) berupa kelopak bunga Sakura yang jatuh perlahan di halaman Beranda.
    *   **Aksen Bayangan Halus:** Saat pengguna melakukan *hover* (mengarahkan kursor) pada kotak produk, akan muncul garis pinggir bercahaya (*glow*) berwarna **merah darah** yang tipis dan misterius. 

---

## 3. Struktur Navigasi Berbasis Rincian (Menu Utama)
Navigasi diletakkan menempel secara semi-transparan (Cushion-Glass) di atap layar dengan elemen responsif.

*   **Sisi Kiri (Branding):** 
    *   Logo siluet **Topeng Kitsune** minimalis berwarna putih keperakan dan cipratan merah.
    *   Teks "OtakuStore" dengan font modern bergaya kaligrafi oriental (*brush-stroke* font pada huruf 'O').
*   **Tengah (Zona Eksplorasi - *Dropdown Hover*):**
    *   `Beranda` (Kembali ke pusat festival).
    *   `Katalog`: Saat disentuh kursor, layar memunculkan menu ke bawah *(mega-menu)* memuat: **Manga**, **Action Figure**, **Blu-Ray & DVD**.
    *   `Studio Kreatif`: Ikon kuas & topeng berdampingan, mengarah pada fitur premium **Custom Outfit Canvas** dan **Custom 3D Forge**.
*   **Sisi Kanan (Aksi & User Management):**
    *   **Pencarian (Search):** Ikon Kaca Pembesar. Jika diklik, bilah input memanjang secara elastis menyerupai gulungan kertas (scroll).
    *   **Notifikasi:** Ikon Lampion/Lonceng Kuil kecil (titik merah jika ada pesan sistem).
    *   **Keranjang Belanja:** Ikon Tas Bekal / Belanja, dengan notifikasi lencana (angka) berisi jumlah pesanan Anda.
    *   **Profil User:** Jika belum login menampilkan tombol *Sign In* bergaris merah. Jika sudah login, ikon avatar *Topeng Rubah* akan memunculkan tautan `Akun Saya`, `Riwayat Transaksi`, dan `Log Out`.

---

## 4. Daftar Halaman Terperinci (Routing List)

### A. Halaman Publik (Tanpa Batasan Akses)
1.  **`/` (Home / Beranda - Halaman Utama):**
    *   **Hero Section:** Video/Animasi pengantar *autoplay* di belakang dengan warna yang digelapkan, teks raksasa menyambut pengguna yang diiringi kelopak sakura jatuh. Tombol CTA (Call to Action) "Mulai Berburu" berwarna Merah Crimson.
    *   **Kitsune's Pick (Rekomendasi Terbaik):** Menampilkan *carousel* miring untuk barang rekomendasi teratas yang estetik.
2.  **`/catalog` (Katalog Utama Grid):**
    *   Tampilan galeri 4 kolom berlatar tekstur pola *Seigaiha* (ombak malam) yang tipis nyaris pudar. 
    *   Bilah pelindung sisi kiri untuk **Saringan Ekstensif (Filter):** Rentang harga, Rating Bintang, dan Filter Ketersediaan Stok.
3.  **`/product/:id` (Halaman Detail Produk Spefisik):**
    *   Layar terbagi rata. Sisi kiri untuk gambar ukuran dominan HD (gambar dapat di *zoom*). 
    *   Sisi kanan untuk spesifikasi harga, lore (cerita produk), pengalih jumlah pesanan (plus/minus), dan tombol "Masukkan Keranjang" besar beranimasi percikan tinta kaligrafi saat ditekan.
4.  **`/login` & `/register`:**
    *   Desain minimalis berfokus ke tengah layar *(Centered Box)*.
    *   *Background* halaman ini berupa lukisan pemandangan malam kuil *Torii* merah dan bulan purnama di kegelapan *(Dark aesthetic)*. Setelah berhasil masuk/daftar, otomatis menyimpan JWT dan direstorasikan rutenya.

### B. Halaman Eksklusif Interaktif (Wajib Login)
5.  **`/custom-outfit` (Canvas Editor & Image Upload):**
    *   Bilah Kiri: Menampilkan katalog tata letak model pakaian (Hoodie/T-shirt).
    *   Tengah Layar Utama: *Canvas* interaktif (Fabric.js atau react-konva) di mana *user* bisa mengunggah lambang klub Anime-nya, memperbesar ukurannya, dan memutarnya pada pakaian Virtual tersebut.
6.  **`/custom-3d` (Oven 3D Action Figure):**
    *   Antarmuka menyelimuti seluruh layar (*Full-Screen*). Berisi kanvas `@react-three/fiber`. 
    *   Menampilkan *Action Figure* dasar (Bahan tanah liat abu-abu). Terdapat *Joystick* virtual atau kontrol putaran 360 derajat menggunakan klik mouse, lengkap dengan panel pencahayaan *(Studio Lights)* untuk memeriksa presisi desain referensi punggungnya.
7.  **`/cart` (Rangkuman Keranjang):**
    *   Berbentuk *list* menyilang. Setiap item menampilkan potrait mini produk.
    *   Di sebelah kanan layar tertancap panel lengket (*Sticky Panel*) yang merangkum kalkulasi kuitansi, input bilah validasi **Kode Diskon Kupon**, dan Kalkulator sub-total Harga murni real-time dari Zustand.
8.  **`/checkout` (Stasiun Pembayaran):**
    *   Layar dibagi ke Alamat Pengiriman dan Ekspedisi.
    *   Opsi tombol Gerbang Pembayaran modern. Tombol eksekusi mutlak berada pada ujung bawah kanan untuk mengirim total `OrderRequestDTO` ke `OrderController`.

---

## 5. Model Struktur Tipe Ekstensif (Frontend to Backend Map)

Sebagai acuan untuk membangun *Typescript Interfaces* dan sistem `Zustand State` agar struktur penyimpanan Browser tidak melenceng / bentrok saat mengirim beban (payload) JSON ke Backend Spring Boot:

**A. User Context Management (Zustand: `useUserStore`)**
Menampung identitas sesi login persisten (Tersimpan ke `localStorage` agar sesi JWT tidak hilang saat di-Refresh).
```typescript
interface UserState {
   id: number | null;            // (Integrasi dari DTO Backend)
   name: string | null;
   email: string | null;
   role: "Admin" | "Customer" | null;
   token: string | null;         // Master Key ke Axios Bearer Interceptor
   login: (userData: any, token: string) => void;
   logout: () => void;
}
```

**B. Cart Management (Zustand: `useCartStore`)**
Penampungan masif sebelum data melangkah ke meja kasir (Checkout API `OrderController`). Disusun agar meniru format persis `OrderRequestDTO`.
```typescript
interface CartItem {
    productId?: number;          // Untuk keranjang Reguler Catalog
    customOrderId?: number;      // Jika berasal dari menu /custom-outfit atau /custom-3d
    name: string;                // Diambil hanya untuk render visual list React
    price: number;               // Digunakan untuk render sub-total instan di layar
    quantity: number;
    thumbnailUrl: string;        // Render foto di Keranjang List
}

interface CartState {
    items: CartItem[];           // Array isi keranjang
    discountCode: string | null; // Simpan "OTAKUNEW" misal tervalidasi API DiscountController
    
    // Actions / Pemicu Mutasi React
    addToCart: (item: CartItem) => void;
    removeFromCart: (identifierId: number, isCustom: boolean) => void;
    applyDiscount: (code: string) => void;
    clearCart: () => void;       // Dijalankan otomatis usai OTK-2012 (Sukses Transaksi)
    
    // Getters Real-Time Kalkulasi Browser
    getTotalItems: () => number; // Mengontrol badge tas belanja di Navbar Kanan
    getSubTotal: () => number;   // Dikalikan seluruh isi item array
}
```

**C. Skema Interaksi Pemanggilan Axios API (Contoh Proses `fetch`)**
Saat pengguna melakukan "Checkout", Antarmuka akan secara otomatis memecah *Store* yang kompleks tadi dan memeras isinya agar **hanya** bagian pentingnya yang mendarat di Spring Boot sesuai selera `OrderRequestDTO` milik Java:
```typescript
const payloadKeBackend = {
    userId: userStore.id,
    discountCode: cartStore.discountCode,
    items: cartStore.items.map(cart => ({
         productId: cart.productId || null,
         customOrderId: cart.customOrderId || null,
         quantity: cart.quantity
    }))
};

axios.post('/api/v1/orders', payloadKeBackend);
// Jika status respon 200 (Success), eksekusi cartStore.clearCart() dan navigasi ke Dashboard!
```
