package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.OrderItemRequestDTO;
import com.otaku.ecommerce.dto.OrderItemResponseDTO;
import com.otaku.ecommerce.dto.OrderRequestDTO;
import com.otaku.ecommerce.dto.OrderResponseDTO;
import com.otaku.ecommerce.entity.*;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    // Validasi transisi status order
    private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
        "Pending",              List.of("Waiting_Verification", "Processing", "Paid", "Shipped", "Cancelled", "Expired"),
        "Waiting_Verification", List.of("Processing", "Paid", "Shipped", "Cancelled", "Rejected"),
        "Processing",           List.of("Shipped", "Cancelled", "Rejected"),
        "Paid",                 List.of("Processing", "Shipped", "Cancelled", "Rejected"),
        "Shipped",              List.of("Completed", "Delivered", "Cancelled"),
        "Delivered",            List.of("Completed"),
        "Completed",            List.of(),
        "Cancelled",            List.of(),
        "Rejected",             List.of(),
        "Expired",              List.of()
    );

    @Autowired private OrderRepository        orderRepository;
    @Autowired private OrderItemRepository    orderItemRepository;
    @Autowired private UserRepository         userRepository;
    @Autowired private ProductRepository      productRepository;
    @Autowired private CustomOrderRepository  customOrderRepository;
    @Autowired private DiscountRepository     discountRepository;
    @Autowired private OrderTrackingRepository orderTrackingRepository;
    @Autowired private PaymentLogRepository    paymentLogRepository;
    @Autowired private PaymentProofRepository    paymentProofRepository;
    @Autowired private BiteshipService biteshipService;

    // ─── Create Order (dari email JWT, bukan userId dari body) ────────────────
    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO request, String userEmail) {
        // Ambil user dari email JWT — bukan dari request body (A01 IDOR fix)
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new CustomBusinessException("OTK-4014", "List item order tidak boleh kosong", 400);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        Order order = new Order();
        order.setUser(user);
        order.setStatus("Pending");
        order.setCreatedAt(LocalDateTime.now());
        order.setTotalAmount(BigDecimal.ZERO);
        order.setFinalAmount(BigDecimal.ZERO);
        order.setShippingAddress(request.getShippingAddress());
        order.setCourierName(request.getCourierName());
        order.setCourierCode(request.getCourierCode());

        // Simpan order dahulu untuk mendapatkan ID
        order = orderRepository.save(order);

        // Proses setiap item — validasi stok sebelum simpan
        for (OrderItemRequestDTO itemDto : request.getItems()) {
            if (itemDto.getQuantity() == null || itemDto.getQuantity() <= 0) {
                throw new CustomBusinessException("OTK-4013", "Quantity tidak valid (harus > 0)", 400);
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setQuantity(itemDto.getQuantity());

            if (itemDto.getProductId() != null) {
                Product product = productRepository.findById(itemDto.getProductId())
                        .orElseThrow(() -> new CustomBusinessException("OTK-4044", "Produk tidak ditemukan", 404));

                // A01: Validasi stok — cegah overselling
                if (product.getStockQuantity() < itemDto.getQuantity()) {
                    throw new CustomBusinessException("OTK-4095",
                        "Stok produk '" + product.getName() + "' tidak mencukupi (tersedia: "
                        + product.getStockQuantity() + ")", 409);
                }

                // Kurangi stok setelah validasi
                product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
                productRepository.save(product);

                item.setProduct(product);
                item.setUnitPrice(product.getPrice());
                totalAmount = totalAmount.add(product.getPrice().multiply(new BigDecimal(itemDto.getQuantity())));

            } else if (itemDto.getCustomOrderId() != null) {
                CustomOrder customOrder = customOrderRepository.findById(itemDto.getCustomOrderId())
                        .orElseThrow(() -> new CustomBusinessException("OTK-4045", "Custom order tidak ditemukan", 404));

                if (!"Quoted".equals(customOrder.getStatus())) {
                    throw new CustomBusinessException("OTK-4096",
                        "Harga custom order belum ditetapkan Admin (status: " + customOrder.getStatus() + ")", 400);
                }
                if (customOrder.getPrice() == null) {
                    throw new CustomBusinessException("OTK-4096", "Harga custom order belum ditetapkan Admin", 400);
                }

                item.setCustomOrder(customOrder);
                item.setUnitPrice(customOrder.getPrice());
                totalAmount = totalAmount.add(customOrder.getPrice().multiply(new BigDecimal(itemDto.getQuantity())));

                // Update status custom order ke Ordered
                customOrder.setStatus("Ordered");
                customOrderRepository.save(customOrder);
            } else {
                throw new CustomBusinessException("OTK-4010", "Setiap item harus memiliki productId atau customOrderId", 400);
            }
            orderItemRepository.save(item);
        }

        order.setTotalAmount(totalAmount);
        BigDecimal finalAmount = totalAmount;

        // Proses Diskon (dengan validasi kuota & expiry)
        Discount appliedDiscount = null;
        if (request.getDiscountCode() != null && !request.getDiscountCode().isBlank()) {
            appliedDiscount = discountRepository.findByCode(request.getDiscountCode())
                    .orElseThrow(() -> new CustomBusinessException("OTK-4043", "Kode diskon tidak ditemukan", 404));

            if (!Boolean.TRUE.equals(appliedDiscount.getIsActive()))
                throw new CustomBusinessException("OTK-4092", "Kode diskon sudah tidak aktif", 400);
            if (appliedDiscount.getExpiryDate() != null && appliedDiscount.getExpiryDate().isBefore(LocalDateTime.now()))
                throw new CustomBusinessException("OTK-4093", "Kode diskon sudah kadaluarsa", 400);
            if (appliedDiscount.getMaxUsage() != null && appliedDiscount.getUsageCount() >= appliedDiscount.getMaxUsage())
                throw new CustomBusinessException("OTK-4094", "Kuota kode diskon sudah habis", 409);

            appliedDiscount.setUsageCount(appliedDiscount.getUsageCount() + 1);
            discountRepository.save(appliedDiscount);
            order.setDiscount(appliedDiscount);

            if ("Percentage".equalsIgnoreCase(appliedDiscount.getDiscountType())) {
                BigDecimal discountAmt = totalAmount.multiply(appliedDiscount.getDiscountValue())
                        .divide(new BigDecimal(100), RoundingMode.HALF_UP);
                finalAmount = totalAmount.subtract(discountAmt);
            } else if ("Fixed".equalsIgnoreCase(appliedDiscount.getDiscountType())) {
                finalAmount = totalAmount.subtract(appliedDiscount.getDiscountValue());
            }
        }

        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) finalAmount = BigDecimal.ZERO;

        order.setFinalAmount(finalAmount);
        order = orderRepository.save(order);

        addTrackingHistory(order.getId(), "Pending", "Pesanan berhasil dibuat, menunggu pembayaran");

        return buildResponse(order, appliedDiscount);
    }
 
    // ─── Cancel Order (oleh Customer, dengan restorasi stok) ────────────────
    @Transactional
    public void cancelOrder(Integer orderId, String userEmail) {
        if (orderId == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));

        // Security: Hanya pemilik yang bisa membatalkan
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new CustomBusinessException("OTK-4030", "Anda tidak memiliki izin untuk membatalkan pesanan ini", 403);
        }

        // Validasi Status: Hanya pesanan "Pending" yang bisa dibatalkan
        if (!"Pending".equals(order.getStatus())) {
            throw new CustomBusinessException("OTK-4091", "Pesanan tidak dapat dibatalkan karena status sudah " + order.getStatus(), 400);
        }

        // Restorasi Stok Produk
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                productRepository.increaseStock(item.getProduct().getId(), item.getQuantity());
                log.info("[STOCK-RESTORE] Stok produk '{}' dikembalikan sebanyak {} karena pembatalan pesanan INV-{}", 
                    item.getProduct().getName(), item.getQuantity(), orderId);
            } else if (item.getCustomOrder() != null) {
                CustomOrder co = item.getCustomOrder();
                co.setStatus("Quoted"); // Kembalikan status custom order ke penawaran
                customOrderRepository.save(co);
            }
        }

        order.setStatus("Cancelled");
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        addTrackingHistory(orderId, "Cancelled", "Pesanan dibatalkan oleh pelanggan.");
        log.info("[ORDER-CANCEL] Order {} telah dibatalkan oleh user {}", orderId, userEmail);
    }
     // ─── Get Order by ID (dengan ownership check via @PreAuthorize di controller) ─
    public OrderResponseDTO getOrderById(Integer orderId) {
        if (orderId == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));
        return buildResponse(order, order.getDiscount());
    }

    // ─── Get Orders by User (hanya milik sendiri) ─────────────────────────────
    public List<OrderResponseDTO> getOrdersByUser(String userEmail) {
        return orderRepository.findByUserEmail(userEmail).stream()
                .map(o -> buildResponse(o, o.getDiscount()))
                .collect(Collectors.toList());
    }

    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(o -> buildResponse(o, o.getDiscount()))
                .collect(Collectors.toList());
    }

    public org.springframework.data.domain.Page<OrderResponseDTO> getPagedOrders(String tab, String type, String term, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
        );
        return orderRepository.findFilteredOrders(tab, type, term, pageable)
                .map(o -> buildResponse(o, o.getDiscount()));
    }

    // ─── Update Status Order (Admin, dengan validasi transisi) ───────────────
    @Transactional
    public void updateOrderStatus(Integer orderId, String newStatus) {
        updateOrderDetails(orderId, newStatus, null, null);
    }

    @Transactional
    public void updateOrderDetails(Integer orderId, String status, String courierCode, String trackingNumber) {
        if (orderId == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));

        if (status != null && !status.isEmpty()) {
            List<String> allowed = VALID_TRANSITIONS.getOrDefault(order.getStatus(), List.of());
            if (!allowed.contains(status)) {
                throw new CustomBusinessException("OTK-4091",
                    "Status tidak bisa diubah dari '" + order.getStatus() + "' ke '" + status + "'", 400);
            }

            // [Langkah 5] Validasi wajib resi saat status Shipped (Kecuali jika ini flow otomatis)
            if ("Shipped".equals(status) && (trackingNumber == null || trackingNumber.isBlank())) {
                throw new CustomBusinessException("OTK-4012", "Nomor resi (waybill) wajib diisi untuk status SHIPPED", 400);
            }

            order.setStatus(status);

            // [Audit] Generate Invoice & Payment Proof Otomatis saat Processing/Shipped
            if ("Processing".equals(status)) {
                addTrackingHistory(orderId, status, "💰 Pembayaran divalidasi. Pesanan sedang disiapkan.");
            } else if ("Shipped".equals(status)) {
                addTrackingHistory(orderId, status, "🚚 Pesanan telah diserahkan ke kurir. Nomor Resi: " + (trackingNumber != null ? trackingNumber : order.getTrackingNumber()));
            } else if ("Rejected".equals(status) || "Cancelled".equals(status)) {
                // Restorasi Stok Produk
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null) {
                        productRepository.increaseStock(item.getProduct().getId(), item.getQuantity());
                        log.info("[STOCK-RESTORE] Stok produk '{}' dikembalikan sebanyak {} karena pesanan {} menjadi {}", 
                            item.getProduct().getName(), item.getQuantity(), orderId, status);
                    } else if (item.getCustomOrder() != null) {
                        CustomOrder co = item.getCustomOrder();
                        co.setStatus("Quoted"); // Kembalikan status custom order ke penawaran
                        customOrderRepository.save(co);
                    }
                }
                addTrackingHistory(orderId, status, "Status pesanan diperbarui menjadi: " + status + ". Stok dikembalikan.");
            } else {
                addTrackingHistory(orderId, status, "Status pesanan diperbarui menjadi: " + status);
            }
        }

        if (courierCode != null) order.setCourierCode(courierCode);
        if (trackingNumber != null) order.setTrackingNumber(trackingNumber);

        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        
        log.info("[ORDER-UPDATE] Order {} updated: status={}, resi={}", orderId, status, trackingNumber);
    }

    @Transactional
    public OrderResponseDTO processAutomatedShipping(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));

        log.info("[LOGISTIK-OTOMATIS] Menghasilkan resi otomatis (Biteship) untuk Order #{}: {}", orderId);

        String autoWaybill = biteshipService.createOrder(order);

        if (autoWaybill == null || autoWaybill.isEmpty()) {
             // Fallback jika API Biteship gagal (misal tidak ada internet)
             String courier = (order.getCourierCode() != null && !order.getCourierCode().isEmpty()) ? order.getCourierCode().toUpperCase() : "JNE";
             String randomSuffix = String.valueOf((int)(Math.random() * 90000000) + 10000000);
             autoWaybill = "BSTST-" + courier + "-" + randomSuffix;
        }

        // Update Order Details secara otomatis ke Shipped
        updateOrderDetails(orderId, "Shipped", null, autoWaybill);

        return buildResponse(order, order.getDiscount());
    }

    @Transactional
    public boolean validateAndReduceStock(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));
        
        boolean allSuccess = true;
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                int updatedRows = productRepository.reduceStock(item.getProduct().getId(), item.getQuantity());
                if (updatedRows == 0) {
                    allSuccess = false;
                    log.warn("[STOCK] Gagal mengurangi stok untuk produk {}. Stok tidak mencukupi.", item.getProduct().getName());
                }
            }
        }
        return allSuccess;
    }
    
    @Transactional
    public void generateAutoTracking(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));
        
        // Generate nomor resi simulasi yang bisa dilacak di Mock Mode (dimulai dengan MOCK)
        String courier = order.getCourierCode() != null ? order.getCourierCode().toUpperCase() : "JNE";
        String randomSuffix = String.valueOf((int)(Math.random() * 90000) + 10000);
        String autoResi = "MOCK-" + courier + "-" + order.getId() + "-" + randomSuffix;
        
        order.setTrackingNumber(autoResi);
        order.setStatus("Shipped"); // Langsung ke Shipped
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        
        addTrackingHistory(orderId, "Processing", "Pesanan sedang dikemas.");
        addTrackingHistory(orderId, "Shipped", "Pesanan telah dikirim secara otomatis. Nomor Resi: " + autoResi);
    }

    // ─── Order Tracking ───────────────────────────────────────────────────────
    @Transactional
    public void addTrackingHistory(Integer orderId, String status, String description) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            OrderTracking tracking = new OrderTracking();
            tracking.setOrder(order);
            tracking.setStatus(status);
            tracking.setDescription(description);
            orderTrackingRepository.save(tracking);
        }
    }

    @Transactional
    public void addTrackingHistoryByWaybill(String waybillId, String status, String description) {
        if (waybillId == null || waybillId.isEmpty()) return;
        Order order = orderRepository.findByTrackingNumber(waybillId).orElse(null);
        if (order != null) {
            OrderTracking tracking = new OrderTracking();
            tracking.setOrder(order);
            tracking.setStatus(status);
            tracking.setDescription(description);
            orderTrackingRepository.save(tracking);
            
            // Opsional: perbarui status order jika paket Delivered
            if ("delivered".equalsIgnoreCase(status) && !"Completed".equals(order.getStatus())) {
                order.setStatus("Completed");
                orderRepository.save(order);
            }
        } else {
            log.warn("[WEBHOOK] Order dengan resi {} tidak ditemukan.", waybillId);
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────
    public OrderResponseDTO buildResponse(Order order, Discount discount) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderId(order.getId());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setFinalAmount(order.getFinalAmount());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCourierName(order.getCourierName());
        dto.setCourierCode(order.getCourierCode());
        dto.setTrackingNumber(order.getTrackingNumber());
        dto.setPaymentUrl(order.getPaymentUrl());
        dto.setPaymentInvoiceId(order.getPaymentInvoiceId());
        dto.setPaymentStatus(order.getPaymentStatus());

        // Cari Payment Method dari log terakhir
        paymentLogRepository.findTopByOrderIdOrderByIdDesc(order.getId())
            .ifPresent(log -> {
                try {
                    // Coba ambil payment_method dari raw payload JSON jika ada
                    if (log.getRawPayload() != null && log.getRawPayload().contains("payment_method")) {
                        dto.setPaymentMethod(log.getRawPayload().split("\"payment_method\":\"")[1].split("\"")[0]);
                    } else {
                        dto.setPaymentMethod("Xendit");
                    }
                } catch (Exception e) {
                    dto.setPaymentMethod("Xendit");
                }
            });

        // Set list bukti (Payment & Shipping)
        List<com.otaku.ecommerce.dto.OrderResponseDTO.PaymentProofDTO> proofs = paymentProofRepository.findByOrderId(order.getId())
            .stream().map(p -> {
                com.otaku.ecommerce.dto.OrderResponseDTO.PaymentProofDTO pdto = new com.otaku.ecommerce.dto.OrderResponseDTO.PaymentProofDTO();
                pdto.setProofType(p.getProofType());
                pdto.setExternalReference(p.getExternalReference());
                pdto.setDescription(p.getDescription());
                pdto.setCreatedAt(p.getCreatedAt());
                return pdto;
            }).collect(Collectors.toList());
        dto.setPaymentProofs(proofs);

        List<OrderItemResponseDTO> itemDTOs = order.getItems().stream().map(item -> {
            OrderItemResponseDTO idto = new OrderItemResponseDTO();
            idto.setItemId(item.getId());
            BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : java.math.BigDecimal.ZERO;
            int qty = item.getQuantity() != null ? item.getQuantity() : 1;
            idto.setQuantity(qty);
            idto.setUnitPrice(unitPrice);
            idto.setTotalPrice(unitPrice.multiply(new java.math.BigDecimal(qty)));
            
            if (item.getProduct() != null) {
                idto.setProductName(item.getProduct().getName());
                idto.setProductImage(item.getProduct().getImageUrl());
                idto.setAvailableStock(item.getProduct().getStockQuantity());
            } else if (item.getCustomOrder() != null) {
                idto.setProductName("Custom Order: " + item.getCustomOrder().getServiceType());
                idto.setCustomOrderId(item.getCustomOrder().getId());
                idto.setProductImage(item.getCustomOrder().getPreviewImageUrl() != null ? 
                                    item.getCustomOrder().getPreviewImageUrl() : 
                                    item.getCustomOrder().getImageReferenceUrl());
            }
            return idto;
        }).collect(Collectors.toList());
        dto.setItems(itemDTOs);
        
        List<com.otaku.ecommerce.dto.OrderTrackingDTO> trackingDTOs = orderTrackingRepository.findByOrderIdOrderByCreatedAtDesc(order.getId())
                .stream().map(t -> {
                    com.otaku.ecommerce.dto.OrderTrackingDTO td = new com.otaku.ecommerce.dto.OrderTrackingDTO();
                    td.setId(t.getId());
                    td.setStatus(t.getStatus());
                    td.setDescription(t.getDescription());
                    td.setCreatedAt(t.getCreatedAt());
                    return td;
                }).collect(Collectors.toList());
        dto.setTrackingHistory(trackingDTOs);

        if (discount != null) dto.setDiscountCode(discount.getCode());
        return dto;
    }
}
