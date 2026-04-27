package com.otaku.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * CustomOrderRequestDTO — userId dan price TIDAK ada di sini.
 * - userId diambil dari JWT token (cegah IDOR)
 * - price ditetapkan Admin via PATCH /admin/custom-orders/{id}/price (cegah price manipulation)
 */
public class CustomOrderRequestDTO {

    // userId DIHAPUS — diambil dari JWT token
    // price DIHAPUS — ditetapkan Admin setelah review

    @NotBlank(message = "Service type tidak boleh kosong")
    private String serviceType; // AF_3D / Outfit

    private String imageReferenceUrl; 

    @NotBlank(message = "Konfigurasi tidak boleh kosong")
    private String configurationJson; // Konfigurasi detail

    private String previewImageUrl;

    private java.math.BigDecimal price;

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getImageReferenceUrl() { return imageReferenceUrl; }
    public void setImageReferenceUrl(String imageReferenceUrl) { this.imageReferenceUrl = imageReferenceUrl; }
    public String getConfigurationJson() { return configurationJson; }
    public void setConfigurationJson(String configurationJson) { this.configurationJson = configurationJson; }
    public String getPreviewImageUrl() { return previewImageUrl; }
    public void setPreviewImageUrl(String previewImageUrl) { this.previewImageUrl = previewImageUrl; }
    public java.math.BigDecimal getPrice() { return price; }
    public void setPrice(java.math.BigDecimal price) { this.price = price; }
}
