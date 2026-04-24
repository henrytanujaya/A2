package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.PaymentRequestDTO;
import com.otaku.ecommerce.dto.PaymentResponseDTO;
import com.otaku.ecommerce.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/token")
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<PaymentResponseDTO>> createPaymentToken(
            Authentication auth, 
            @RequestBody PaymentRequestDTO request) {
        PaymentResponseDTO response = paymentService.createPaymentToken(auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Token pembayaran berhasil dibuat", response));
    }

    // Mock Webhook Endpoint
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Void>> handleWebhook(@RequestBody Map<String, Object> payload) {
        // Asumsi format payload dari mock gateway
        String token = (String) payload.get("token");
        String status = (String) payload.get("transaction_status");
        Integer orderId = (Integer) payload.get("order_id");

        if (orderId != null && status != null) {
            paymentService.processPaymentNotification(token, status, orderId);
        }

        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Webhook received", null));
    }
}
