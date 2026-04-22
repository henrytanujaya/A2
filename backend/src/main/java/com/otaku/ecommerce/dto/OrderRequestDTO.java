package com.otaku.ecommerce.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

/**
 * OrderRequestDTO — userId TIDAK ada di sini (diambil dari JWT token, bukan dari client).
 * Ini mencegah IDOR: User A tidak bisa membuat order atas nama User B.
 */
public class OrderRequestDTO {

    // userId DIHAPUS — diambil dari Authentication JWT di controller

    @NotEmpty(message = "List item order tidak boleh kosong")
    @Valid
    private List<OrderItemRequestDTO> items;

    @Pattern(regexp = "^[A-Z0-9]{4,15}$", message = "Format kode diskon tidak valid")
    private String discountCode;

    public List<OrderItemRequestDTO> getItems() { return items; }
    public void setItems(List<OrderItemRequestDTO> items) { this.items = items; }
    public String getDiscountCode() { return discountCode; }
    public void setDiscountCode(String discountCode) { this.discountCode = discountCode; }
}
