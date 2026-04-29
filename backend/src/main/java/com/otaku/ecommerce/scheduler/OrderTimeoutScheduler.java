package com.otaku.ecommerce.scheduler;

import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.repository.OrderRepository;
import com.otaku.ecommerce.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OrderTimeoutScheduler {

    private static final Logger log = LoggerFactory.getLogger(OrderTimeoutScheduler.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    /**
     * Membatalkan pesanan 'Pending' yang sudah lewat 15 menit setiap 1 menit
     */
    @Scheduled(fixedRate = 60000) // 1 menit
    @Transactional
    public void cancelTimedOutOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(15);
        List<Order> timedOutOrders = orderRepository.findByStatusAndCreatedAtBefore("Pending", cutoff);

        if (timedOutOrders.isEmpty()) return;

        log.info("[ORDER-TIMEOUT] Menemukan {} pesanan yang kadaluwarsa.", timedOutOrders.size());

        for (Order order : timedOutOrders) {
            try {
                // Gunakan 'Expired' untuk membedakan dari pembatalan manual
                orderService.updateOrderStatus(order.getId(), "Expired");
                orderService.addTrackingHistory(order.getId(), "Expired", "Pesanan kadaluwarsa otomatis karena melewati batas waktu pembayaran (15 Menit).");
                log.info("[ORDER-TIMEOUT] Order ID {} berhasil di-set Expired.", order.getId());
            } catch (Exception e) {
                log.error("[ORDER-TIMEOUT] Gagal membatalkan Order ID {}: {}", order.getId(), e.getMessage());
            }
        }
    }
}
