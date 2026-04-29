package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.OrderResponseDTO;
import com.otaku.ecommerce.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
@PreAuthorize("hasRole('Admin')")
public class AdminOrderController {

    @Autowired
    private OrderService orderService;

    // ─── Get All Orders (semua user) ──────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.success("OTK-2024", "Semua order berhasil diambil", orderService.getAllOrders()));
    }

    // ─── Get Order by ID (tanpa batasan kepemilikan) ─────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> getOrderById(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("OTK-2022", "Detail order berhasil diambil", orderService.getOrderById(id)));
    }

    // ─── Update Status Order (validasi transisi otomatis) ────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Object>> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("OTK-4010", "Status tidak boleh kosong"));

        orderService.updateOrderStatus(id, newStatus);
        return ResponseEntity.ok(ApiResponse.success("OTK-2023", "Status order berhasil diperbarui", null));
    }

    @PostMapping("/{id}/automate-shipping")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> automateShipping(@PathVariable Integer id) {
        OrderResponseDTO response = orderService.processAutomatedShipping(id);
        return ResponseEntity.ok(ApiResponse.success("OTK-2025", "Otomasi pengiriman berhasil dijalankan", response));
    }
}
