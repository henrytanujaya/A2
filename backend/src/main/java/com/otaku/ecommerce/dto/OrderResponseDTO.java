package com.otaku.ecommerce.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponseDTO {
    private Integer orderId;
    private BigDecimal totalAmount;
    private BigDecimal finalAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String discountCode;
    private String shippingAddress;
    private String courierName;
    private String courierCode;
    private String trackingNumber;
    private String paymentUrl;
    private String paymentInvoiceId;
    private String paymentStatus;
    private String paymentMethod;
    private List<OrderItemResponseDTO> items;
    private List<OrderTrackingDTO> trackingHistory;
    private List<PaymentProofDTO> paymentProofs;

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getDiscountCode() { return discountCode; }
    public void setDiscountCode(String discountCode) { this.discountCode = discountCode; }
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    public String getCourierName() { return courierName; }
    public void setCourierName(String courierName) { this.courierName = courierName; }
    public String getCourierCode() { return courierCode; }
    public void setCourierCode(String courierCode) { this.courierCode = courierCode; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public String getPaymentUrl() { return paymentUrl; }
    public void setPaymentUrl(String paymentUrl) { this.paymentUrl = paymentUrl; }
    public String getPaymentInvoiceId() { return paymentInvoiceId; }
    public void setPaymentInvoiceId(String paymentInvoiceId) { this.paymentInvoiceId = paymentInvoiceId; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public List<OrderItemResponseDTO> getItems() { return items; }
    public void setItems(List<OrderItemResponseDTO> items) { this.items = items; }
    public List<OrderTrackingDTO> getTrackingHistory() { return trackingHistory; }
    public void setTrackingHistory(List<OrderTrackingDTO> trackingHistory) { this.trackingHistory = trackingHistory; }
    public List<PaymentProofDTO> getPaymentProofs() { return paymentProofs; }
    public void setPaymentProofs(List<PaymentProofDTO> paymentProofs) { this.paymentProofs = paymentProofs; }

    public static class PaymentProofDTO {
        private String proofType;
        private String externalReference;
        private String description;
        private LocalDateTime createdAt;

        public String getProofType() { return proofType; }
        public void setProofType(String proofType) { this.proofType = proofType; }
        public String getExternalReference() { return externalReference; }
        public void setExternalReference(String externalReference) { this.externalReference = externalReference; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}
