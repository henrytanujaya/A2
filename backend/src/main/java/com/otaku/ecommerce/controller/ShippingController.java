package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.ShippingAreaDTO;
import com.otaku.ecommerce.dto.ShippingRateDTO;
import com.otaku.ecommerce.service.ShippingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.otaku.ecommerce.service.OrderService;
import com.otaku.ecommerce.repository.OrderRepository;
import com.otaku.ecommerce.entity.Order;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/shipping")
public class ShippingController {

    @Autowired
    private ShippingService shippingService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    /**
     * Pencarian area/kota berdasarkan kata kunci.
     * Contoh: GET /api/v1/shipping/areas?query=bandung
     */
    @GetMapping("/areas")
    public ResponseEntity<ApiResponse<ShippingAreaDTO>> searchAreas(@RequestParam String query) {
        if (query == null || query.trim().length() < 3) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("OTK-4000", "Query pencarian minimal 3 karakter"));
        }
        ShippingAreaDTO response = shippingService.searchAreas(query.trim());
        return ResponseEntity.ok(ApiResponse.success("OTK-3001", "Pencarian area berhasil", response));
    }

    /**
     * Menghitung tarif ongkos kirim.
     * Contoh: GET /api/v1/shipping/cost?destination=JKT-UTR-CLN&weight=1500&courier=jne
     */
    @GetMapping("/cost")
    public ResponseEntity<ApiResponse<ShippingRateDTO>> getCost(
            @RequestParam String destination,
            @RequestParam(defaultValue = "500") Integer weight,
            @RequestParam(defaultValue = "") String courier) {

        ShippingRateDTO rates = shippingService.getShippingCost(destination, weight, courier);
        return ResponseEntity.ok(ApiResponse.success("OTK-3002", "Tarif pengiriman berhasil dihitung", rates));
    }

    /**
     * Webhook Biteship untuk menerima pembaruan status logistik.
     */
    @PostMapping("/biteship-webhook")
    public ResponseEntity<ApiResponse<Void>> handleBiteshipWebhook(@RequestBody Map<String, Object> payload) {
        try {
            String event = (String) payload.get("event");
            if ("order.status".equals(event)) {
                String waybillId = (String) payload.get("waybill_id");
                String status = (String) payload.get("status"); // e.g. "delivered"
                String statusName = (String) payload.get("status_name"); // e.g. "Paket Diterima"

                if (waybillId != null && status != null) {
                    Optional<Order> orderOpt = orderRepository.findByTrackingNumber(waybillId);
                    if (orderOpt.isPresent()) {
                        Order order = orderOpt.get();
                        
                        // Tambahkan riwayat pelacakan
                        orderService.addTrackingHistory(order.getId(), "Shipped", "UPDATE KURIR: " + statusName + " (" + status + ")");

                        // Update status jika delivered
                        if ("delivered".equalsIgnoreCase(status) && "Shipped".equalsIgnoreCase(order.getStatus())) {
                            orderService.updateOrderStatus(order.getId(), "Delivered");
                            orderService.addTrackingHistory(order.getId(), "Delivered", "Paket telah sampai di tujuan (Update dari Sistem Logistik).");
                        }
                    }
                }
            }
            return ResponseEntity.ok(ApiResponse.success("OTK-2000", "Biteship Webhook received", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("SERVER_ERROR", "Error processing webhook: " + e.getMessage()));
        }
    }
}
