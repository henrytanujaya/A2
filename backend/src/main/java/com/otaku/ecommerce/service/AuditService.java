package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.OrderResponseDTO;
import com.otaku.ecommerce.dto.SalesAuditResponseDTO;
import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    public SalesAuditResponseDTO getMonthlySalesReport(int month, int year) {
        List<Order> orders = orderRepository.findAuditOrders(month, year);

        BigDecimal totalRevenue = orders.stream()
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Map to DTO using existing OrderService buildResponse logic
        // However, buildResponse is private in OrderService.
        // I'll assume I can use a public mapper if available, or I'll just map the fields here.
        // Actually, let's check if OrderService has a public buildResponse or if I should make it public.
        
        List<OrderResponseDTO> transactions = orders.stream()
                .map(o -> {
                    OrderResponseDTO dto = orderService.buildResponse(o, o.getDiscount());
                    // Tambahkan metadata pembayaran jika diperlukan untuk audit
                    return dto;
                })
                .collect(Collectors.toList());

        return new SalesAuditResponseDTO(totalRevenue, (long) orders.size(), transactions);
    }
}
