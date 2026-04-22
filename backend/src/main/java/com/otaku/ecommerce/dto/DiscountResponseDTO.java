package com.otaku.ecommerce.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.Pattern;

/**
 * DiscountResponseDTO — Menggantikan return entitas JPA Discount langsung ke response publik.
 * Hanya expose field yang aman: code, type, value, category.
 * Tidak mengekspos DiscountID atau field internal lainnya.
 */
public class DiscountResponseDTO {

    @Pattern(regexp = "^[A-Z0-9]{4,15}$", message = "Format kode diskon tidak valid")
    private String code;
    
    @Pattern(regexp = "^(Percentage|Fixed)$", message = "Tipe diskon tidak valid")
    private String discountType;
    
    private BigDecimal discountValue;
    
    @Pattern(regexp = "^(All|ActionFigure|CustomOutfit|Custom3D)$", message = "Kategori diskon tidak valid")
    private String applicableCategory;
    
    private Boolean isActive;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }
    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }
    public String getApplicableCategory() { return applicableCategory; }
    public void setApplicableCategory(String applicableCategory) { this.applicableCategory = applicableCategory; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
