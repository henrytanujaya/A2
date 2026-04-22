package com.otaku.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * CustomOrderRequestDTO — userId dan price TIDAK ada di sini.
 * - userId diambil dari JWT token (cegah IDOR)
 * - price ditetapkan Admin via PATCH /admin/custom-orders/{id}/price (cegah price manipulation)
 */
public class CustomOrderRequestDTO {

    // userId DIHAPUS — diambil dari JWT token
    // price DIHAPUS — ditetapkan Admin setelah review

    @NotBlank(message = "ServiceType tidak boleh kosong")
    @Pattern(regexp = "^(AF_3D|Outfit)$", message = "Tipe layanan tidak valid")
    private String serviceType; // AF_3D / Outfit

    @Pattern(regexp = "^https?:\\/\\/res\\.cloudinary\\.com\\/.*(?:\\.(?:png|jpg|jpeg|webp))?$", message = "URL gambar referensi harus dari Cloudinary")
    private String imageReferenceUrl; // URL dari hasil upload Cloudinary

    @Pattern(regexp = "^\\{(?s:.)*\\}$", message = "Format konfigurasi harus berupa JSON object yang valid")
    private String configurationJson; // Konfigurasi detail

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getImageReferenceUrl() { return imageReferenceUrl; }
    public void setImageReferenceUrl(String imageReferenceUrl) { this.imageReferenceUrl = imageReferenceUrl; }
    public String getConfigurationJson() { return configurationJson; }
    public void setConfigurationJson(String configurationJson) { this.configurationJson = configurationJson; }
}
