# Analisis Regex Lengkap dan Mendalam untuk DTO

Berikut adalah pembaruan analisis komprehensif untuk **semua** field di dalam setiap file DTO (`backend/src/main/java/com/otaku/ecommerce/dto`). Pembaruan ini memastikan tidak ada satu pun properti berbasis String yang terlewat, serta meningkatkan akurasi Regex agar sesuai dengan kondisi dunia nyata (seperti nama yang menggunakan tanda kutip/strip, atau nama produk yang memiliki tanda kurung).

---

## 1. `ApiResponse.java`
Menangani respons standar ke client.
*   **`internalCode`**
    *   **Regex**: `^[A-Z0-9_]+$`
    *   *Penjelasan*: Memaksa format uppercase, angka, dan underscore (contoh: `SUCCESS_200`, `ERR_NOT_FOUND`).
*   **`message`**
    *   **Regex**: `^[^<>{}]*$`
    *   *Penjelasan*: Mencegah injeksi tag HTML dasar (Anti-XSS). Pesan error atau sukses dari server sebaiknya tidak pernah mengandung tag script.

## 2. `LoginRequestDTO.java`
Mengatur data kredensial login pengguna.
*   **`email`**
    *   **Regex**: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
    *   *Penjelasan*: Format email standar RFC-like.
*   **`password`**
    *   **Regex**: `^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,}$`
    *   *Penjelasan*: Keamanan tingkat tinggi (Minimal 8 karakter, wajib mengandung huruf besar, huruf kecil, angka, DAN simbol khusus).

## 3. `RegisterRequestDTO.java`
Mengatur data pendaftaran.
*   **`name`**
    *   **Regex**: `^[a-zA-Z\s\-']+$`
    *   *Penjelasan*: Mengizinkan alfabet, spasi, tanda strip (`-`), dan tanda kutip tunggal (`'`). Penting karena banyak nama asli seperti "O'Connor" atau "Mary-Jane" yang akan ditolak jika hanya menggunakan alfabet.
*   **`email`** & **`password`**
    *   *Regex*: (Gunakan Regex dari LoginRequestDTO).

## 4. `UserDTO.java`
Objek kembalian identitas user.
*   **`name`** & **`email`**: (Gunakan Regex dari RegisterRequestDTO).
*   **`role`**
    *   **Regex**: `^(USER|ADMIN)$`
    *   *Penjelasan*: Mengunci *Role-Based Access* agar hanya bernilai antara dua opsi ini.

## 5. `ProductRequestDTO.java` & `ProductDTO.java`
Mengatur entri dan luaran katalog produk.
*   **`category`**
    *   **Regex**: `^(ActionFigure|Outfit|Manga|BluRay)$`
    *   *Penjelasan*: Enumerasi konseptual kategori produk di database.
*   **`name`**
    *   **Regex**: `^[a-zA-Z0-9\s\-_\(\)\[\]]+$`
    *   *Penjelasan*: Nama produk sangat beragam. Regex ini mengizinkan alfabet, angka, spasi, strip, underscore, dan juga tanda kurung biasa `()` serta kurung siku `[]` (contoh: "Goku (Super Saiyan) [Limited Edition]").
*   **`description`**
    *   **Regex**: `^[a-zA-Z0-9\s\-_.,!?'"()]*$`
    *   *Penjelasan*: Validasi deskripsi teks bebas yang aman, mengizinkan tanda baca standar penulisan namun memblokir karakter pemrograman/HTML seperti `<` dan `>`.
*   **`imageUrl`**
    *   **Regex**: `^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(?:\?.*)?$`
    *   *Penjelasan*: Mengizinkan protokol HTTP/HTTPS, harus berakhiran ekstensi gambar, dan secara dinamis menerima *query parameters* (seperti `?v=123`).

## 6. `DiscountRequestDTO.java` & `DiscountResponseDTO.java`
Mengatur diskon dan promosi.
*   **`code`**
    *   **Regex**: `^[A-Z0-9]{4,15}$`
    *   *Penjelasan*: Kupon diskon umumnya ketat. Hanya huruf kapital dan angka, minimal 4 huruf dan maksimal 15 huruf (contoh: `OTAKUSALE10`).
*   **`discountType`**
    *   **Regex**: `^(Percentage|Fixed)$`
    *   *Penjelasan*: Tipe kalkulasi diskon.
*   **`applicableCategory`**
    *   **Regex**: `^(All|ActionFigure|CustomOutfit|Custom3D)$`
    *   *Penjelasan*: Variasi kategori kupon. Khusus diskon bisa memiliki nilai `All`.

## 7. `OrderRequestDTO.java` & `OrderResponseDTO.java`
Mengatur pemesanan.
*   **`discountCode`**
    *   *Regex*: (Gunakan Regex `code` dari DiscountRequestDTO).
*   **`status`** (hanya pada Response)
    *   **Regex**: `^(PENDING|PAID|CANCELLED|SHIPPED|COMPLETED)$`
    *   *Penjelasan*: Melacak daur hidup (lifecycle) dari sebuah keranjang pesanan.

## 8. `OrderItemRequestDTO.java`
Item dalam keranjang.
*   **`productId`**, **`customOrderId`**, **`quantity`**
    *   **Regex**: `^[1-9]\d*$`
    *   *Penjelasan*: Meskipun properti ini ber-tipe `Integer`, jika input string di-parsing, regex ini menjamin angkanya adalah Bilangan Bulat Positif murni (tidak ada desimal, tidak boleh minus, dan tidak boleh diawali nol mutlak kecuali angka itu nol sendiri).

## 9. `CustomOrderRequestDTO.java`
Pesanan spesifik buatan tangan/mesin.
*   **`serviceType`**
    *   **Regex**: `^(AF_3D|Outfit)$`
    *   *Penjelasan*: Membatasi layanan custom (Action Figure 3D atau Custom Cosplay).
*   **`imageReferenceUrl`**
    *   **Regex Cloudinary Strict**: `^https?:\/\/res\.cloudinary\.com\/.*(?:\.(?:png|jpg|jpeg|webp))?$`
    *   *Penjelasan*: Sangat ketat, memastikan bahwa URL gambar yang dilampirkan pelanggan **wajib** berasal dari server Cloudinary, demi mencegah *Remote File Inclusion* (RFI).
*   **`configurationJson`**
    *   **Regex**: `^\{(?s:.)*\}$`
    *   *Penjelasan*: Validasi *loose* untuk mengecek apakah format dikirim dalam bentuk kurung kurawal pembuka `{` dan penutup `}`. `(?s:.)` mengizinkan newline di dalam JSON.

## 10. `CustomOrderResponseDTO.java`
*   **`serviceType`**: (Sama dengan atas).
*   **`status`**
    *   **Regex**: `^(PENDING|REVIEWING|ACCEPTED|REJECTED|PAID)$`
    *   *Penjelasan*: Daur hidup *custom order* berbeda dengan pesanan biasa karena harus melewati fase `REVIEWING` oleh admin untuk penetapan harga, dan bisa saja `REJECTED` jika desain/gambar tidak masuk akal.

---
### Saran Penerapan Utama
1.  **Untuk nama:** Ganti `@Pattern` nama Anda yang lama dengan yang baru ini `^[a-zA-Z\s\-']+$` untuk menghindari *bug* validasi di frontend saat pelanggan memiliki nama unik.
2.  **Untuk produk:** Tambahkan validasi pada `description` dan `name` agar produk Anda kebal dari serangan XSS secara *backend-level*.
3.  **Untuk password:** Gunakan regex password baru yang lebih kuat dengan mandatori karakter khusus.
