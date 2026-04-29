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

    @GetMapping("/all")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<List<OrderResponseDTO>>> getAllOrders(Authentication authentication) {
        List<OrderResponseDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success("OTK-2023", "Semua data order berhasil diambil", orders));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<OrderResponseDTO>>> getPagedOrders(
            @RequestParam(defaultValue = "all") String tab,
            @RequestParam(defaultValue = "id") String type,
            @RequestParam(required = false) String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        org.springframework.data.domain.Page<OrderResponseDTO> orders = orderService.getPagedOrders(tab, type, term, page, size);
        return ResponseEntity.ok(ApiResponse.success("OTK-2025", "Data order paged berhasil diambil", orders));
    }

    // ─── Get Order by ID (dengan ownership check — IDOR protection) ──────────
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('Admin') or @orderSecurity.isOrderOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> getOrderById(@PathVariable Integer id) {
        OrderResponseDTO response = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success("OTK-2022", "Detail order berhasil diambil", response));
    }

    // ─── Update Order Status & Tracking (Admin & Customer) ───────────────────
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('Admin') or @orderSecurity.isOrderOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Integer id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String courierCode,
            @RequestParam(required = false) String trackingNumber,
            @RequestBody(required = false) java.util.Map<String, String> body) {

        String finalStatus = status;
        if (finalStatus == null && body != null) {
            finalStatus = body.get("status");
        }

        // Security: Jika bukan Admin, hanya boleh update ke status tertentu
        // (OrderService juga memvalidasi transisi status)
        boolean isAdmin = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_Admin"));

        if (!isAdmin && finalStatus != null) {
            if (!finalStatus.equals("Waiting_Verification")) {
                return ResponseEntity.status(403).body(ApiResponse.error("OTK-4030", "Anda tidak memiliki izin untuk mengubah status ke " + finalStatus));
            }
        }

        orderService.updateOrderDetails(id, finalStatus, courierCode, trackingNumber);
        return ResponseEntity.ok(ApiResponse.success("OTK-2024", "Status order berhasil diperbarui", null));
    }
}
