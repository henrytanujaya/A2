package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.OrderRequestDTO;
import com.otaku.ecommerce.dto.OrderResponseDTO;
import com.otaku.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    // ─── Create Order (userId dari JWT, BUKAN dari body — IDOR fix) ──────────
    @PostMapping
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> createOrder(
            @Valid @RequestBody OrderRequestDTO request,
            Authentication authentication) {

        String userEmail = authentication.getName();
        OrderResponseDTO response = orderService.createOrder(request, userEmail);
        return ResponseEntity.status(201)
                .body(ApiResponse.success("OTK-2020", "Order berhasil dibuat", response));
    }

    // ─── Get My Orders ────────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getMyOrders(Authentication authentication) {
        List<OrderResponseDTO> orders = orderService.getOrdersByUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("OTK-2021", "Riwayat order berhasil diambil", orders));
    }

    // ─── Get Order by ID (dengan ownership check — IDOR protection) ──────────
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or @orderSecurity.isOrderOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> getOrderById(@PathVariable Integer id) {
        OrderResponseDTO response = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success("OTK-2022", "Detail order berhasil diambil", response));
    }
}
