package com.otaku.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.Pattern;

/**
 * CustomOrderResponseDTO — Menggantikan return entitas JPA CustomOrder langsung ke response.
 * Mencegah LazyInitializationException dan eksposur struktur database internal.
 */
public class CustomOrderResponseDTO {

    private Integer id;
    private Integer userId;
    
    @Pattern(regexp = "^(AF_3D|Outfit)$", message = "Tipe layanan tidak valid")
    private String serviceType;
    
    @Pattern(regexp = "^https?:\\/\\/res\\.cloudinary\\.com\\/.*(?:\\.(?:png|jpg|jpeg|webp))?$", message = "URL gambar referensi harus dari Cloudinary")
    private String imageReferenceUrl;
    
    @Pattern(regexp = "^\\{(?s:.)*\\}$", message = "Format konfigurasi harus berupa JSON object yang valid")
    private String configurationJson;
    
    private BigDecimal price;
    
    @Pattern(regexp = "^(PENDING|REVIEWING|ACCEPTED|REJECTED|PAID)$", message = "Status custom order tidak valid")
    private String status;
    
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getImageReferenceUrl() { return imageReferenceUrl; }
    public void setImageReferenceUrl(String imageReferenceUrl) { this.imageReferenceUrl = imageReferenceUrl; }
    public String getConfigurationJson() { return configurationJson; }
    public void setConfigurationJson(String configurationJson) { this.configurationJson = configurationJson; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
