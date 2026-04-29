package com.otaku.ecommerce.scheduler;

import com.otaku.ecommerce.dto.TrackingResponseDTO;
import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.entity.OrderTracking;
import com.otaku.ecommerce.repository.OrderRepository;
import com.otaku.ecommerce.repository.OrderTrackingRepository;
import com.otaku.ecommerce.service.OrderService;
import com.otaku.ecommerce.service.TrackingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class ShippingSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(ShippingSyncScheduler.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TrackingService trackingService;

    @Autowired
    private OrderTrackingRepository orderTrackingRepository;

    @Autowired
    private OrderService orderService;

    /**
     * Sinkronisasi status pengiriman.
     * Untuk keperluan DEMO, interval dicepatkan menjadi setiap 5 Detik.
     */
    @Scheduled(fixedRate = 5000) // 5 detik
    @Transactional
    public void syncShippingStatus() {
        // Cari semua pesanan yang sedang dalam pengiriman
        List<Order> shippingOrders = orderRepository.findAll().stream()
                .filter(o -> "Shipped".equalsIgnoreCase(o.getStatus()) && o.getTrackingNumber() != null)
                .toList();

        if (shippingOrders.isEmpty()) return;

        log.info("[SHIPPING-SYNC] Memulai sinkronisasi untuk {} pesanan.", shippingOrders.size());

        for (Order order : shippingOrders) {
            try {
                String courier = order.getCourierCode() != null ? order.getCourierCode().toLowerCase() : "jne";
                TrackingResponseDTO tracking = trackingService.trackPackage(courier, order.getTrackingNumber());

                if (tracking != null && tracking.getData() != null && tracking.getData().getSummary() != null) {
                    String currentStatus = tracking.getData().getSummary().getStatus();
                    String latestDesc = !tracking.getData().getHistory().isEmpty() 
                            ? tracking.getData().getHistory().get(0).getDesc() 
                            : currentStatus;

                    // Ambil history terakhir dari database untuk order ini
                    java.util.Optional<OrderTracking> latestHistory = orderTrackingRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId());
                    boolean isDuplicate = latestHistory.isPresent() && 
                            latestHistory.get().getDescription().contains(latestDesc);

                    if (isDuplicate) {
                        log.debug("[SHIPPING-SYNC] Tidak ada perubahan untuk Order ID {}. Skip.", order.getId());
                        continue;
                    }
                    
                    // Jika status delivered, tambahkan info khusus ke history dan perbarui status order
                    if ("DELIVERED".equalsIgnoreCase(currentStatus) || "RECEIVED".equalsIgnoreCase(currentStatus)) {
                        orderService.updateOrderStatus(order.getId(), "Delivered");
                        orderService.addTrackingHistory(order.getId(), "Delivered", "UPDATE KURIR: " + latestDesc);
                        orderService.addTrackingHistory(order.getId(), "Delivered", "Paket telah sampai di tujuan. Silahkan konfirmasi penerimaan barang.");
                        log.info("[SHIPPING-SYNC] Order ID {} telah sampai (Delivered).", order.getId());
                    } else {
                        orderService.addTrackingHistory(order.getId(), "Shipped", "UPDATE KURIR: " + latestDesc);
                    }
                }
            } catch (Exception e) {
                log.error("[SHIPPING-SYNC] Gagal sinkronisasi Order ID {}: {}", order.getId(), e.getMessage());
            }
        }
    }
}
