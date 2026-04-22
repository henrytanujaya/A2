package com.otaku.ecommerce.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;


/**
 * ProductRequestDTO — Untuk create & update produk (Admin only).
 */
public class ProductRequestDTO {

    @NotBlank(message = "Kategori tidak boleh kosong")
    @Pattern(regexp = "^(ActionFigure|Outfit|Manga|BluRay)$", message = "Kategori tidak valid")
    private String category; // ActionFigure, Outfit, Manga, BluRay

    @NotBlank(message = "Nama produk tidak boleh kosong")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-_\\(\\)\\[\\]]+$", message = "Format nama produk tidak valid")
    private String name;

    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-_.,!?'\"()]*$", message = "Format deskripsi tidak valid")
    private String description;

    @NotNull(message = "Harga tidak boleh kosong")
    @DecimalMin(value = "0.01", message = "Harga harus lebih dari 0")
    private BigDecimal price;

    @NotNull(message = "Stok tidak boleh kosong")
    @Min(value = 0, message = "Stok tidak boleh negatif")
    private Integer stockQuantity;

    @Pattern(regexp = "^https?:\\/\\/.*\\.(?:png|jpg|jpeg|gif|webp)(?:\\?.*)?$", message = "Format URL gambar tidak valid")
    private String imageUrl;

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
