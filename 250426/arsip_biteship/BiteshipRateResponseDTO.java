package com.otaku.ecommerce.dto;

import java.util.List;

public class BiteshipRateResponseDTO {
    private boolean success;
    private String error;
    private Pricing pricing;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public Pricing getPricing() { return pricing; }
    public void setPricing(Pricing pricing) { this.pricing = pricing; }

    public static class Pricing {
        private List<Courier> couriers;
        public List<Courier> getCouriers() { return couriers; }
        public void setCouriers(List<Courier> couriers) { this.couriers = couriers; }
    }

    public static class Courier {
        private String courier_name;
        private String courier_code;
        private String courier_service_name;
        private String courier_service_code;
        private String tier;
        private String description;
        private String service_type;
        private long price;
        private String estimated_delivery_time;
        private String guaranteed_delivery_time;

        public String getCourier_name() { return courier_name; }
        public void setCourier_name(String courier_name) { this.courier_name = courier_name; }
        public String getCourier_code() { return courier_code; }
        public void setCourier_code(String courier_code) { this.courier_code = courier_code; }
        public String getCourier_service_name() { return courier_service_name; }
        public void setCourier_service_name(String courier_service_name) { this.courier_service_name = courier_service_name; }
        public String getCourier_service_code() { return courier_service_code; }
        public void setCourier_service_code(String courier_service_code) { this.courier_service_code = courier_service_code; }
        public String getTier() { return tier; }
        public void setTier(String tier) { this.tier = tier; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getService_type() { return service_type; }
        public void setService_type(String service_type) { this.service_type = service_type; }
        public long getPrice() { return price; }
        public void setPrice(long price) { this.price = price; }
        public String getEstimated_delivery_time() { return estimated_delivery_time; }
        public void setEstimated_delivery_time(String estimated_delivery_time) { this.estimated_delivery_time = estimated_delivery_time; }
        public String getGuaranteed_delivery_time() { return guaranteed_delivery_time; }
        public void setGuaranteed_delivery_time(String guaranteed_delivery_time) { this.guaranteed_delivery_time = guaranteed_delivery_time; }
    }
}
