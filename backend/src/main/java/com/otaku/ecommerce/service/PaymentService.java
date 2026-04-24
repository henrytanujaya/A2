package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.PaymentRequestDTO;
import com.otaku.ecommerce.dto.PaymentResponseDTO;
import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    public PaymentResponseDTO createPaymentToken(String userEmail, PaymentRequestDTO request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));

        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new CustomBusinessException("OTK-403", "Akses ditolak", 403);
        }

        if (!"Pending".equalsIgnoreCase(order.getStatus()) && !"UNPAID".equalsIgnoreCase(order.getStatus())) {
            throw new CustomBusinessException("OTK-400", "Order tidak valid untuk pembayaran", 400);
        }

        // Mock payment token generation (e.g., Midtrans Snap Token)
        String token = UUID.randomUUID().toString();
        
        PaymentResponseDTO response = new PaymentResponseDTO();
        response.setToken(token);
        response.setPaymentUrl("https://mock-payment-gateway.com/checkout/" + token);

        return response;
    }

    // Dipanggil oleh webhook / notifikasi dari payment gateway
    public void processPaymentNotification(String token, String transactionStatus, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));

        if ("settlement".equalsIgnoreCase(transactionStatus) || "capture".equalsIgnoreCase(transactionStatus)) {
            orderService.updateOrderStatus(orderId, "Paid");
            orderService.addTrackingHistory(orderId, "Paid", "Pembayaran berhasil dikonfirmasi via Payment Gateway");
        } else if ("cancel".equalsIgnoreCase(transactionStatus) || "expire".equalsIgnoreCase(transactionStatus)) {
            orderService.updateOrderStatus(orderId, "Cancelled");
            orderService.addTrackingHistory(orderId, "Cancelled", "Pembayaran gagal atau kedaluwarsa");
        }
    }
}
