package com.otaku.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CartItemDTO {
    private Integer id; // CartItemID (DB) or virtual index for guest
    private Integer productId;
    private Integer customOrderId;
    private String name;
    private String imageUrl;
    private String details;
    private BigDecimal price;
    private Integer quantity;
    private LocalDateTime addedAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }
    public Integer getCustomOrderId() { return customOrderId; }
    public void setCustomOrderId(Integer customOrderId) { this.customOrderId = customOrderId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }
}
