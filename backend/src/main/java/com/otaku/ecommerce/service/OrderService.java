package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.OrderItemRequestDTO;
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
        "Pending",    List.of("Processing", "Cancelled"),
        "Processing", List.of("Shipped", "Cancelled"),
        "Shipped",    List.of("Completed"),
        "Completed",  List.of(),
        "Cancelled",  List.of()
    );

    @Autowired private OrderRepository        orderRepository;
    @Autowired private OrderItemRepository    orderItemRepository;
    @Autowired private UserRepository         userRepository;
    @Autowired private ProductRepository      productRepository;
    @Autowired private CustomOrderRepository  customOrderRepository;
    @Autowired private DiscountRepository     discountRepository;
    @Autowired private OrderTrackingRepository orderTrackingRepository;

    // ─── Create Order (dari email JWT, bukan userId dari body) ────────────────
    @SuppressWarnings("null")
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

    // ─── Get All Orders (Admin) ───────────────────────────────────────────────
    public List<OrderResponseDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(o -> buildResponse(o, o.getDiscount()))
                .collect(Collectors.toList());
    }

    // ─── Update Status Order (Admin, dengan validasi transisi) ───────────────
    @Transactional
    public void updateOrderStatus(Integer orderId, String newStatus) {
        if (orderId == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomBusinessException("OTK-4042", "Order tidak ditemukan", 404));

        List<String> allowed = VALID_TRANSITIONS.getOrDefault(order.getStatus(), List.of());
        if (!allowed.contains(newStatus)) {
            throw new CustomBusinessException("OTK-4091",
                "Status tidak bisa diubah dari '" + order.getStatus() + "' ke '" + newStatus + "'", 400);
        }
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        
        addTrackingHistory(orderId, newStatus, "Status pesanan diperbarui menjadi: " + newStatus);
        
        log.info("[ORDER-STATUS] Order {} diubah ke status {}", orderId, newStatus);
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

    // ─── Helper ───────────────────────────────────────────────────────────────
    private OrderResponseDTO buildResponse(Order order, Discount discount) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderId(order.getId());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setFinalAmount(order.getFinalAmount());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCourierName(order.getCourierName());
        
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
