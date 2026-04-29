package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.AdminDashboardResponseDTO;
import com.otaku.ecommerce.dto.AdminDashboardResponseDTO.ActivityDTO;
import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.entity.Product;
import com.otaku.ecommerce.repository.OrderRepository;
import com.otaku.ecommerce.repository.ProductRepository;
import com.otaku.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    public AdminDashboardResponseDTO getDashboardData() {
        AdminDashboardResponseDTO dto = new AdminDashboardResponseDTO();

        long totalCustomer = userRepository.countByRoleIgnoreCase("customer");
        long totalOrder = orderRepository.count();
        BigDecimal revenue = orderRepository.sumRevenue();
        long stockWarning = productRepository.countByStockQuantityLessThan(1);

        dto.setTotalCustomer(totalCustomer);
        dto.setTotalOrder(totalOrder);
        dto.setRevenue(revenue != null ? revenue : BigDecimal.ZERO);
        dto.setStockWarning(stockWarning);

        List<ActivityDTO> activities = new ArrayList<>();

        List<Order> topOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();
        for (Order o : topOrders) {
            String userName = (o.getUser() != null) ? o.getUser().getName() : "Customer";
            String desc = "Pesanan #" + o.getId() + " (" + o.getStatus() + ") oleh " + userName;
            activities.add(new ActivityDTO("ORDER", desc, o.getCreatedAt()));
        }

        List<Product> topProducts = productRepository.findTop5ByOrderByUpdatedAtDesc();
        for (Product p : topProducts) {
            String desc = "Update Stok/Produk: " + p.getName() + " (Stok: " + p.getStockQuantity() + ")";
            activities.add(new ActivityDTO("RESTOCK", desc, p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt()));
        }

        activities.sort(Comparator.comparing(ActivityDTO::getTimestamp, 
            Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        List<ActivityDTO> recentActivities = activities.stream().limit(5).collect(Collectors.toList());
        dto.setRecentActivities(recentActivities);

        return dto;
    }
}
