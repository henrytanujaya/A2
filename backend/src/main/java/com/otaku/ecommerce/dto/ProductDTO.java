package com.otaku.ecommerce.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.Pattern;

public class ProductDTO {
    private Integer id;
    
    @Pattern(regexp = "^(ActionFigure|Outfit|Manga|BluRay)$", message = "Kategori tidak valid")
    private String category;
    
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-_\\(\\)\\[\\]]+$", message = "Format nama produk tidak valid")
    private String name;
    
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-_.,!?'\"()]*$", message = "Format deskripsi tidak valid")
    private String description;
    
    private BigDecimal price;
    private Integer stockQuantity;
    
    @Pattern(regexp = "^https?:\\/\\/.*\\.(?:png|jpg|jpeg|gif|webp)(?:\\?.*)?$", message = "Format URL gambar tidak valid")
    private String imageUrl;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
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
