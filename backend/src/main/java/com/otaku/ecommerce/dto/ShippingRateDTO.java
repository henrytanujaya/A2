package com.otaku.ecommerce.dto;

import java.util.List;

/**
 * DTO internal untuk data tarif pengiriman.
 * Tidak terikat pada API eksternal manapun.
 */
public class ShippingRateDTO {
    private boolean success;
    private String message;
    private List<CourierOption> couriers;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<CourierOption> getCouriers() { return couriers; }
    public void setCouriers(List<CourierOption> couriers) { this.couriers = couriers; }

    public static class CourierOption {
        private String courierCode;
        private String courierName;
        private String serviceName;
        private String serviceCode;
        private long price;
        private String estimatedDay;

        public String getCourierCode() { return courierCode; }
        public void setCourierCode(String courierCode) { this.courierCode = courierCode; }
        public String getCourierName() { return courierName; }
        public void setCourierName(String courierName) { this.courierName = courierName; }
        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }
        public String getServiceCode() { return serviceCode; }
        public void setServiceCode(String serviceCode) { this.serviceCode = serviceCode; }
        public long getPrice() { return price; }
        public void setPrice(long price) { this.price = price; }
        public String getEstimatedDay() { return estimatedDay; }
        public void setEstimatedDay(String estimatedDay) { this.estimatedDay = estimatedDay; }
    }
}
