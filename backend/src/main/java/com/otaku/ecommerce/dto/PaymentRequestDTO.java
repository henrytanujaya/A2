package com.otaku.ecommerce.dto;

public class PaymentRequestDTO {
    private Integer orderId;
    private String paymentMethod; // e.g., CREDIT_CARD, BANK_TRANSFER, GOPAY

    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
