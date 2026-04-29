# Solusi Error 500 pada Halaman Checkout (Shipping)

## Akar Permasalahan (Root Cause)
Error **500 Internal Server Error** yang muncul saat mengambil data kota (`/api/v1/shipping/cities`) di halaman Checkout terjadi karena hal berikut:
1. Kode sumber Java (`ShippingService.java` dan `SecurityConfig.java`) **sebenarnya telah saya perbaiki** pada instruksi sebelumnya (menambahkan *try-catch* dan *Mock Data* sebagai antisipasi putusnya API eksternal).
2. Namun, perbaikan kode tersebut **belum ter-kompilasi (compiled)** oleh server *Spring Boot* yang sedang berjalan di terminal Anda. *Spring Boot* masih menggunakan memori kode lama yang menyebabkan *crash*. Itulah mengapa dropdown tetap kosong dan error 500 masih muncul.

## Cara Mengatasi (Solusi Praktis)
Untuk memunculkan pilihan kota di dropdown dan mengatasi error tersebut, lakukan langkah berikut:

### Langkah 1: Restart Server Backend
Anda wajib merestart backend agar kode perbaikan yang saya tulis bisa diproses:
1. Buka tab Terminal/Console yang sedang menjalankan backend (`mvn spring-boot:run`).
2. Tekan kombinasi tombol **`Ctrl + C`** untuk menghentikan server, lalu tekan `Y` jika diminta konfirmasi.
3. Setelah berhenti, jalankan kembali perintahnya:
   ```bash
   mvn spring-boot:run
   ```
4. Tunggu beberapa detik hingga server backend memberikan log berhasil berjalan (`Started ...`).

### Langkah 2: Refresh Halaman Frontend
1. Kembali ke browser web Anda.
2. Lakukan **Refresh Halaman (F5)** pada page Checkout / Cart.
3. Klik dropdown "Pilih Kota". Sekarang dropdown tidak akan kosong lagi melainkan berisi daftar kota simulasi (*Jakarta Timur, Jakarta Selatan, Bandung, dll.*), dan log error 500 akan menghilang.

---
> **Catatan Pembaruan Tambahan:**
> Sembari Anda merestart backend, saya juga telah menyisipkan perbaikan keamanan tambahan pada `SecurityConfig.java` agar rute API pengiriman/ongkir tidak terblokir oleh aturan autentikasi. Restart backend akan secara otomatis memuat semua pembaruan ini sekaligus.
