package com.otaku.ecommerce.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DiscountRequestDTO — Untuk create & update kode diskon (Admin only).
 */
public class DiscountRequestDTO {

    @NotBlank(message = "Kode diskon tidak boleh kosong")
    @Pattern(regexp = "^[A-Z0-9]{4,15}$", message = "Format kode diskon tidak valid")
    private String code;

    @NotBlank(message = "Tipe diskon tidak boleh kosong")
    @Pattern(regexp = "^(Percentage|Fixed)$", message = "Tipe diskon tidak valid")
    private String discountType; // Percentage / Fixed

    @NotNull(message = "Nilai diskon tidak boleh kosong")
    @DecimalMin(value = "0.01", message = "Nilai diskon harus lebih dari 0")
    private BigDecimal discountValue;

    @Pattern(regexp = "^(All|ActionFigure|CustomOutfit|Custom3D)$", message = "Kategori diskon tidak valid")
    private String applicableCategory; // All, ActionFigure, CustomOutfit, Custom3D

    private Integer maxUsage;      // null = unlimited

    private LocalDateTime expiryDate;  // null = tidak ada batas waktu

    private Boolean isActive = true;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }
    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }
    public String getApplicableCategory() { return applicableCategory; }
    public void setApplicableCategory(String applicableCategory) { this.applicableCategory = applicableCategory; }
    public Integer getMaxUsage() { return maxUsage; }
    public void setMaxUsage(Integer maxUsage) { this.maxUsage = maxUsage; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
