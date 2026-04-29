package com.otaku.ecommerce.dto;

import java.math.BigDecimal;
import java.util.List;

public class SalesAuditResponseDTO {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private List<OrderResponseDTO> transactions;

    public SalesAuditResponseDTO(BigDecimal totalRevenue, Long totalOrders, List<OrderResponseDTO> transactions) {
        this.totalRevenue = totalRevenue;
        this.totalOrders = totalOrders;
        this.transactions = transactions;
    }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }
    public List<OrderResponseDTO> getTransactions() { return transactions; }
    public void setTransactions(List<OrderResponseDTO> transactions) { this.transactions = transactions; }
}
