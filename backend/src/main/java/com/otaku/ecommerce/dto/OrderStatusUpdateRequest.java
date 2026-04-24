package com.otaku.ecommerce.dto;

public class OrderStatusUpdateRequest {
    private String status;
    private String courierCode;
    private String trackingNumber;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCourierCode() { return courierCode; }
    public void setCourierCode(String courierCode) { this.courierCode = courierCode; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
}
