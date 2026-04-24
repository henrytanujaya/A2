package com.otaku.ecommerce.dto;

public class PaymentResponseDTO {
    private String paymentUrl;
    private String token;

    public String getPaymentUrl() { return paymentUrl; }
    public void setPaymentUrl(String paymentUrl) { this.paymentUrl = paymentUrl; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
