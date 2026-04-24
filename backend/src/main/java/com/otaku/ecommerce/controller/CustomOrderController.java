package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.CustomOrderRequestDTO;
import com.otaku.ecommerce.dto.CustomOrderResponseDTO;
import com.otaku.ecommerce.service.CustomOrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/custom-orders")
public class CustomOrderController {

    @Autowired
    private CustomOrderService customOrderService;

    // ─── Create Custom Order (userId dari JWT, price NULL — Admin yang tetapkan) ─
    @PostMapping
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<CustomOrderResponseDTO>> createCustomOrder(
            @Valid @RequestBody CustomOrderRequestDTO request,
            Authentication authentication) {

        String userEmail = authentication.getName();
        CustomOrderResponseDTO response = customOrderService.createCustomOrder(request, userEmail);
        return ResponseEntity.status(201)
                .body(ApiResponse.success("OTK-2030", "Custom order berhasil dibuat", response));
    }

    // ─── Get My Custom Orders ─────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<List<CustomOrderResponseDTO>>> getMyCustomOrders(Authentication authentication) {
        List<CustomOrderResponseDTO> orders = customOrderService.getMyCustomOrders(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("OTK-2033", "Custom order berhasil diambil", orders));
    }

    // ─── Get Custom Order by ID (dengan ownership check) ─────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or @orderSecurity.isCustomOrderOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<CustomOrderResponseDTO>> getCustomOrderById(@PathVariable Integer id) {
        // Ambil dari list milik sendiri untuk verifikasi cepat
        CustomOrderResponseDTO co = customOrderService.getMyCustomOrders(
            ((org.springframework.security.core.Authentication)
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication())
                .getName()
        ).stream().filter(c -> c.getId().equals(id)).findFirst()
         .orElseGet(() -> {
             // Admin bisa akses semua
             return customOrderService.getAllCustomOrders().stream()
                     .filter(c -> c.getId().equals(id)).findFirst()
                     .orElseThrow(() -> new com.otaku.ecommerce.exception.CustomBusinessException(
                         "OTK-4045", "Custom order tidak ditemukan", 404));
         });
        return ResponseEntity.ok(ApiResponse.success("OTK-2033", "Detail custom order berhasil diambil", co));
    }
}
