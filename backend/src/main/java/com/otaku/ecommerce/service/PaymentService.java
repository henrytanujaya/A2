package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.PaymentRequestDTO;
import com.otaku.ecommerce.dto.PaymentResponseDTO;
import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.otaku.ecommerce.entity.PaymentLog;
import com.otaku.ecommerce.repository.PaymentLogRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    @Value("${xendit.secret-key}")
    private String xenditSecretKey;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentLogRepository paymentLogRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @SuppressWarnings({ "unchecked", "null" })
    public PaymentResponseDTO createPaymentToken(String userEmail, PaymentRequestDTO request) {
        if (request.getOrderId() == null) {
            throw new CustomBusinessException("OTK-400", "Order ID wajib diisi", 400);
        }

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));

        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new CustomBusinessException("OTK-403", "Akses ditolak", 403);
        }

        // Jika sudah ada invoice valid, kembalikan yang lama
        if (order.getPaymentUrl() != null && "UNPAID".equals(order.getPaymentStatus())) {
            PaymentResponseDTO response = new PaymentResponseDTO();
            @SuppressWarnings("null")
            String invoiceId = order.getPaymentInvoiceId();
            response.setToken(invoiceId);
            response.setPaymentUrl(order.getPaymentUrl());
            return response;
        }

        try {
            String url = "https://api.xendit.co/v2/invoices";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String auth = xenditSecretKey + ":";
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + encodedAuth);

            Map<String, Object> body = new HashMap<>();
            body.put("external_id", "ORDER-" + order.getId());
            body.put("amount", order.getFinalAmount());
            body.put("payer_email", order.getUser().getEmail());
            body.put("description", "Pembayaran Otaku E-Commerce Order #" + order.getId());

            // Tambahkan URL redirect
            body.put("success_redirect_url", "http://localhost:5173/my-orders");
            body.put("failure_redirect_url", "http://localhost:5173/my-orders");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            Map<String, Object> xenditRes = restTemplate.postForObject(url, entity, Map.class);

            if (xenditRes != null && xenditRes.containsKey("invoice_url")) {
                String invoiceId = String.valueOf(xenditRes.get("id"));
                String invoiceUrl = String.valueOf(xenditRes.get("invoice_url"));

                order.setPaymentInvoiceId(invoiceId);
                order.setPaymentUrl(invoiceUrl);
                order.setPaymentStatus("UNPAID");
                orderRepository.save(order);

                PaymentResponseDTO response = new PaymentResponseDTO();
                response.setToken(invoiceId);
                response.setPaymentUrl(invoiceUrl);
                return response;
            } else {
                throw new RuntimeException("Gagal membuat invoice di Xendit");
            }
        } catch (Exception e) {
            throw new CustomBusinessException("OTK-500", "Gagal memproses pembayaran: " + e.getMessage(), 500);
        }
    }

    @Transactional
    public void processXenditWebhook(Map<String, Object> payload) {
        // 0. Awal pemrosesan dengan proteksi null
        if (payload == null || payload.get("external_id") == null) {
            System.out.println("Webhook Info: Payload kosong atau tidak memiliki external_id. Dilewati.");
            return;
        }

        String externalId = String.valueOf(payload.get("external_id"));
        String status = payload.get("status") != null ? String.valueOf(payload.get("status")) : "UNKNOWN";
        
        BigDecimal amountPaid = BigDecimal.ZERO;
        try {
            if (payload.get("amount") != null) {
                amountPaid = new BigDecimal(String.valueOf(payload.get("amount")));
            }
        } catch (Exception e) {
            System.out.println("Gagal parsing nominal: " + payload.get("amount"));
        }
        
        System.out.println("Detail Pembayaran:");
        System.out.println("- External ID: " + externalId);
        System.out.println("- Status: " + status);
        System.out.println("- Amount: " + amountPaid);

        // externalId format: "ORDER-123"
        Integer orderId;
        try {
            if (!externalId.startsWith("ORDER-")) {
                System.out.println("Webhook Info: Menerima data non-order atau simulasi tes (" + externalId + "). Dilewati.");
                return;
            }
            orderId = Integer.parseInt(externalId.replace("ORDER-", ""));
        } catch (Exception e) {
            System.err.println("Gagal memproses External ID: " + externalId);
            return;
        }
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> {
                    System.err.println("Order dengan ID " + orderId + " tidak ditemukan di database.");
                    return new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404);
                });

        // 1. Audit Logging
        try {
            PaymentLog logEntry = new PaymentLog();
            logEntry.setOrder(order);
            logEntry.setExternalId(externalId);
            logEntry.setStatus(status);
            logEntry.setAmount(amountPaid);
            logEntry.setRawPayload(objectMapper.writeValueAsString(payload));
            paymentLogRepository.save(logEntry);
        } catch (Exception e) {
            // Log error silently agar tidak membatalkan update status
            System.err.println("Gagal menyimpan payment log: " + e.getMessage());
        }

        // 2. Fraud Check: Amount Validation
        if (amountPaid.compareTo(order.getFinalAmount()) != 0) {
            throw new CustomBusinessException("OTK-FRAUD", "Nominal pembayaran tidak sesuai!", 400);
        }

        // 3. Update Status
        if ("PAID".equalsIgnoreCase(status) || "SETTLED".equalsIgnoreCase(status)) {
            // Idempotency check
            if (!"Shipped".equalsIgnoreCase(order.getStatus()) && !"Completed".equalsIgnoreCase(order.getStatus())
                    && !"STOCK_CONFLICT".equalsIgnoreCase(order.getStatus())) {
                order.setPaymentStatus("PAID");
                orderRepository.save(order);

                // Cek Stok dan Kurangi secara atomik
                boolean stockReduced = orderService.validateAndReduceStock(orderId);

                if (stockReduced) {
                    // Berhasil kurangi stok -> Lanjut ke Menunggu Konfirmasi
                    orderService.updateOrderStatus(orderId, "Waiting_Verification");
                    orderService.addTrackingHistory(orderId, "Waiting_Verification",
                            "Pembayaran terverifikasi & stok aman.");
                } else {
                    // GAGAL kurangi stok (Konflik) -> Set status khusus
                    order.setStatus("STOCK_CONFLICT");
                    orderRepository.save(order);
                    orderService.addTrackingHistory(orderId, "STOCK_CONFLICT",
                            "PERINGATAN: Pembayaran diterima namun stok tidak mencukupi saat proses verifikasi.");
                }
            }
        } else if ("EXPIRED".equalsIgnoreCase(status)) {
            order.setPaymentStatus("EXPIRED");
            orderService.updateOrderStatus(orderId, "Cancelled");
            orderService.addTrackingHistory(orderId, "Cancelled", "Invoice Xendit kedaluwarsa");
        }

        orderRepository.save(order);
    }
}
