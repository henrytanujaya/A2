package com.otaku.ecommerce.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class CartSyncRequestDTO {
    @NotEmpty(message = "Guest cart tidak boleh kosong")
    private List<CartRequestDTO> items;

    public List<CartRequestDTO> getItems() { return items; }
    public void setItems(List<CartRequestDTO> items) { this.items = items; }
}
