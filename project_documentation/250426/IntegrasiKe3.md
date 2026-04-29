# Analisa Integrasi Biteship (RESTClient Java 21)

## 1. Apakah Kompatibel dengan Sistem Saat Ini?
**Jawaban: 100% Kompatibel dan Sangat Direkomendasikan.**

Sistem E-Commerce Otaku saat ini berjalan di atas ekosistem **Java 21 dan Spring Boot 3+**, yang mana merupakan spesifikasi yang sempurna untuk memanfaatkan fitur `RestClient`.

**Perbandingan dengan Sistem Saat Ini:**
*   **Sebelumnya (BinderByte):** Sistem kita saat ini menggunakan API BinderByte untuk mengambil daftar kota dan ongkos kirim. Kode saat ini di `ShippingService.java` menggunakan modul lama dan sempat mengalami kendala "400 Bad Request" di terminal karena perbedaan *Prefix ID* area.
*   **Transisi ke Biteship:** Biteship menawarkan dokumentasi JSON yang lebih bersih dan pembagian area pengiriman (Kecamatan/Kota) yang lebih terstruktur. Mengganti BinderByte dengan Biteship akan menuntaskan bug *Invalid Prefix IDs* tersebut secara permanen.
*   **Penggunaan RestClient:** `RestClient` jauh lebih modern dibanding `RestTemplate` tradisional. Konfigurasi *Base URL* dan *Default Header* (termasuk Authorization) dapat difokuskan di satu tempat, sehingga *error handling* jauh lebih bersih.

---

## 2. Dampak Perubahan (Impact Analysis)
Jika kita menerapkan arsitektur Biteship ini, area mana saja di proyek kita yang harus disesuaikan?
1.  **Backend (`ShippingService.java`)**: Perlu ditulis ulang (*refactor*) dari nol untuk mengganti HTTP Request BinderByte menjadi menggunakan `RestClient` ke endpoint API Biteship (`/v1/rates` dan `/v1/maps/areas`).
2.  **Backend (`OrderService.java`)**: Mengaktifkan penerimaan nomor resi resmi (*waybill/tracking_id*) dari Biteship setelah berhasil membuat pesanan, lalu menyimpannya ke database SQL Server kita.
3.  **Frontend (`Checkout.jsx`)**: Mengganti dropdown daftar kota simulasi menjadi pencarian *Area ID* khas Biteship (pencarian berbasis kecamatan/kode pos).
4.  **Database**: **Kompatibel Penuh**. Tabel `Orders` dan `OrderTracking` yang sudah kita miliki sudah siap menampung resi dan riwayat log perjalanan dari webhook Biteship.

---

## 3. Rundown Eksekusi (Langkah Implementasi Integrasi Ke-3)

Berikut adalah urutan kerja terstruktur (rundown) untuk mengimplementasikan integrasi ekosistem Biteship ke dalam project Otaku E-Commerce:

### Tahap 1: Konfigurasi dan Setup Backend (Estimasi: 30 Menit)
*   [ ] **1.1:** Mendaftarkan *API Key* Biteship di file `.env` dan `application.yml` (`biteship.api.key`).
*   [ ] **1.2:** Membuat DTO Request dan Response yang persis dengan standar JSON Biteship (`ShippingRateRequest`, `BiteshipAreaDTO`, `BiteshipRateDTO`).
*   [ ] **1.3:** Melakukan inisialisasi `RestClient` di *Service Layer* dengan injeksi *Authorization Bearer Token* secara *default*.

### Tahap 2: Refactor Shipping Service (Estimasi: 45 Menit)
*   [ ] **2.1:** Mengubah metode `getCities()` menjadi metode pencarian area Biteship (`/v1/maps/areas`).
*   [ ] **2.2:** Mengganti logika perhitungan ongkir menjadi request ke endpoint `/v1/rates` menggunakan parameter Area ID toko dan Area ID pelanggan, plus berat keranjang (gram).
*   [ ] **2.3:** Menambahkan pengaman *Global Error Handling* menggunakan `.onStatus()` agar backend tidak *crash* jika kuota API habis.

### Tahap 3: Penyesuaian UI/UX Frontend (Estimasi: 1 Jam)
*   [ ] **3.1:** Memodifikasi fitur *Dropdown City* di `Checkout.jsx` untuk menembak endpoint pencarian Area secara *real-time*.
*   [ ] **3.2:** Mengirimkan data `destination_area_id` (berupa deretan karakter unik Biteship) ke backend alih-alih sekadar string "Bandung" atau "Jakarta".
*   [ ] **3.3:** Menampilkan daftar pilihan kurir yang dinamis (JNE, SiCepat, dll) yang benar-benar difilter dari respon Biteship.

### Tahap 4: Implementasi Webhook Otomatisasi Tracking (Estimasi: 1 Jam)
*   [ ] **4.1:** Membuat `WebhookController.java` dengan *endpoint* publik POST `/api/v1/webhooks/biteship`.
*   [ ] **4.2:** Menyusun algoritma: Saat kurir men-scan paket, Biteship akan me-request *webhook* kita. Sistem akan mencari pesanan berdasarkan ID resi, lalu menambahkan entri baru ke tabel `order_tracking`.
*   [ ] **4.3:** Mengatur *Secure Secret Token* agar *endpoint* webhook kita kebal terhadap *Spam/Fake Request* dari peretas luar.

---
**Kesimpulan Lanjutan:**
Desain transisi ini sangat tepat dan menyelesaikan permasalahan skalabilitas (*error 400*) yang ada. Anda sudah menguasai arsitekturnya. Silakan pilih tahap mana yang ingin Anda kerjakan terlebih dahulu!

**Catatan Tambahan:**
ID Key : 69ec709533a42335
Api Key : biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZWNvbWVyY2VhbmltZSIsInVzZXJJZCI6IjY5ZWM2YTZlNmY2YTlkZWZlNzU3NTU5NCIsImlhdCI6MTc3NzEwMjk5N30.Dk9vXe05taBlEXHyKYvYYTvTDGPFbsk-69mK90MvG5A

Ini adalah kredensial **Akun Testing** (Sandbox) yang valid. Menggunakan ini tidak akan mengurangi kuota API Anda yang berbayar.

Berikut adalah parameter lengkap yang diperlukan untuk Endpoint Pencarian Area (Autocomplete) di Biteship, agar bisa menerima input pengguna dan mengubahnya menjadi `destination_area_id`:

### 1. Base URL (Endpoint)
*   **URL:** `https://api.biteship.com/v1/maps/areas`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `q`: Query pencarian (misal: `jakarta`, `bandung`, `surabaya`).
    *   `limit`: Jumlah hasil (misal: `20`).
    *   `country`: Negara (gunakan `ID` untuk Indonesia).

### 2. Header (Header Wajib)
Sama seperti setup sebelumnya, Anda harus selalu menyertakan header Authorization:
```
Authorization: Bearer biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZWNvbWVyY2VhbmltZSIsInVzZXJJZCI6IjY5ZWM2YTZlNmY2YTlkZWZlNzU3NTU5NCIsImlhdCI6MTc3NzEwMjk5N30.Dk9vXe05taBlEXHyKYvYYTvTDGPFbsk-69mK90MvG5A
```

### 3. Contoh Respons JSON (Validitas Data)
Saat Anda mengirim query `?q=bandung`, Biteship akan mengembalikan struktur JSON yang memiliki **ID Unik** untuk setiap wilayah. Data inilah yang harus Anda ambil dan kirim ke endpoint ongkos kirim (`/v1/rates`).

```json
{
    "success": true,
    "data": {
        "areas": [
            {
                "id": "21", 
                "name": "Bandung",
                "type": "city",
                "country": "ID",
                "area_level": "2"
            },
            {
                "id": "22", 
                "name": "Bandung Barat",
                "type": "district",
                "country": "ID",
                "area_level": "3"
            },
            {
                "id": "2212", 
                "name": "Bandung Kulon",
                "type": "subdistrict",
                "country": "ID",
                "area_level": "4"
            }
        ]
    }
}
```

### 4. Instruksi untuk Frontend (`Checkout.jsx`)
Saat pengguna memilih kota:
1.  Backend (Java) akan memanggil endpoint di atas menggunakan query "Bandung".
2.  Backend menerima JSON tersebut dan mengirimkannya kembali ke React.
3.  Anda harus mengambil nilai dari field **`id`** (bukan `name`).
4.  Jika pengguna memilih "Bandung", nilai yang benar untuk dikirim ke API Ongkir adalah `"21"` (atau `"2212"` jika memilih Kecamatan).

Apakah Anda ingin saya menyusun **Mock Data** versi JSON yang lengkap untuk area Jabodetabek dan Bandung (sesuai ID Biteship) agar Anda bisa langsung mencoba fitur ini tanpa menunggu API Biteship aktif?
