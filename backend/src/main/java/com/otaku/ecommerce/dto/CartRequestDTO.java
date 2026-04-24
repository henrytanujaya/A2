package com.otaku.ecommerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CartRequestDTO {
    private Integer productId;
    private Integer customOrderId;

    @NotNull(message = "Quantity tidak boleh kosong")
    @Min(value = 1, message = "Quantity minimal 1")
    private Integer quantity;

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }
    public Integer getCustomOrderId() { return customOrderId; }
    public void setCustomOrderId(Integer customOrderId) { this.customOrderId = customOrderId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
