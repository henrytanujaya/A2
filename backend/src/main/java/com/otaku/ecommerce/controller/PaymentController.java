package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.PaymentRequestDTO;
import com.otaku.ecommerce.dto.PaymentResponseDTO;
import com.otaku.ecommerce.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${xendit.callback-token}")
    private String xenditCallbackToken;

    // Xendit Webhook Endpoint
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Void>> handleWebhook(
            @RequestHeader("x-callback-token") String callbackToken,
            @RequestBody Map<String, Object> payload) {

        // Verifikasi token untuk keamanan
        if (xenditCallbackToken == null || !xenditCallbackToken.equals(callbackToken)) {
            return ResponseEntity.status(401).body(ApiResponse.error("OTK-401", "Unauthorized callback"));
        }

        paymentService.processXenditWebhook(payload);

        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Webhook received and processed", null));
    }

    // Endpoint Simulator untuk Developer (Testing tanpa ngrok)
    @PostMapping("/simulate-webhook")
    public ResponseEntity<ApiResponse<Void>> simulateWebhook(@RequestBody Map<String, Object> payload) {
        System.out.println(">>> [SIMULATOR] Memicu simulasi webhook...");
        paymentService.processXenditWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Simulasi webhook berhasil dipicu", null));
    }
}
