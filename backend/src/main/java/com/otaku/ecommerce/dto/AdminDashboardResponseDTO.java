package com.otaku.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AdminDashboardResponseDTO {
    private long totalCustomer;
    private long totalOrder;
    private BigDecimal revenue;
    private long stockWarning;
    private List<ActivityDTO> recentActivities;

    public static class ActivityDTO {
        private String type; // "ORDER" or "RESTOCK"
        private String description;
        private LocalDateTime timestamp;

        public ActivityDTO(String type, String description, LocalDateTime timestamp) {
            this.type = type;
            this.description = description;
            this.timestamp = timestamp;
        }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }

    public long getTotalCustomer() { return totalCustomer; }
    public void setTotalCustomer(long totalCustomer) { this.totalCustomer = totalCustomer; }
    public long getTotalOrder() { return totalOrder; }
    public void setTotalOrder(long totalOrder) { this.totalOrder = totalOrder; }
    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    public long getStockWarning() { return stockWarning; }
    public void setStockWarning(long stockWarning) { this.stockWarning = stockWarning; }
    public List<ActivityDTO> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<ActivityDTO> recentActivities) { this.recentActivities = recentActivities; }
}
