package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.BiteshipWebhookDTO;
import com.otaku.ecommerce.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/biteship")
    public ResponseEntity<ApiResponse<String>> handleBiteshipWebhook(@RequestBody BiteshipWebhookDTO payload) {
        
        // Pastikan payload memiliki ID resi
        if (payload.getWaybill_id() != null && !payload.getWaybill_id().isEmpty()) {
            
            // Format deskripsi agar rapi
            String description = payload.getNote() != null ? payload.getNote() : "Status update: " + payload.getStatus();
            
            // Panggil fungsi di OrderService untuk menyimpan ke database
            orderService.addTrackingHistoryByWaybill(
                payload.getWaybill_id(), 
                payload.getStatus(), 
                description
            );
        }

        // Selalu kembalikan 200 OK agar Biteship tahu webhook berhasil diterima
        return ResponseEntity.ok(ApiResponse.success("OTK-5000", "Webhook received", null));
    }
}
