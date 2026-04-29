package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.TrackingResponseDTO;
import com.otaku.ecommerce.service.TrackingService;
import com.otaku.ecommerce.service.OrderService;
import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/tracking")
public class TrackingController {

    @Autowired
    private TrackingService trackingService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/{courier}/{awb}")
    public ResponseEntity<ApiResponse<TrackingResponseDTO>> getTracking(
            @PathVariable String courier,
            @PathVariable String awb) {
        
        try {
            TrackingResponseDTO result = trackingService.trackPackage(courier, awb);
            if (result != null && result.getStatus() == 200) {
                return ResponseEntity.ok(new ApiResponse<>(true, "TRACK_SUCCESS", "Tracking data retrieved successfully", result));
            } else {
                String message = (result != null) ? result.getMessage() : "Failed to retrieve tracking data";
                return ResponseEntity.status(400).body(new ApiResponse<>(false, "TRACK_ERROR", message, null));
            }
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode()).body(new ApiResponse<>(false, "TRACK_ERROR", "Gagal melacak paket: Pastikan nomor resi valid.", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "SERVER_ERROR", "Error: " + e.getMessage(), null));
        }
    }

    // Webhook BinderByte
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Void>> handleBinderbyteWebhook(@RequestBody Map<String, Object> payload) {
        try {
            String awb = (String) payload.get("awb");
            String status = (String) payload.get("status");

            if (awb != null && "DELIVERED".equalsIgnoreCase(status)) {
                Optional<Order> orderOpt = orderRepository.findByTrackingNumber(awb);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    if ("Shipped".equalsIgnoreCase(order.getStatus())) {
                        orderService.updateOrderStatus(order.getId(), "Delivered");
                        orderService.addTrackingHistory(order.getId(), "Delivered", "Paket telah sampai di tujuan (Update dari Sistem Logistik).");
                    }
                }
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "WEBHOOK_SUCCESS", "Webhook received", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "SERVER_ERROR", "Error processing webhook: " + e.getMessage(), null));
        }
    }
}
