package com.otaku.ecommerce.dto;

import java.util.List;

public class TrackingResponseDTO {
    private Integer status;
    private String message;
    private Data data;

    public static class Data {
        private Summary summary;
        private Detail detail;
        private List<History> history;

        public Summary getSummary() { return summary; }
        public void setSummary(Summary summary) { this.summary = summary; }
        public Detail getDetail() { return detail; }
        public void setDetail(Detail detail) { this.detail = detail; }
        public List<History> getHistory() { return history; }
        public void setHistory(List<History> history) { this.history = history; }
    }

    public static class Summary {
        private String awb;
        private String courier;
        private String status;
        private String date;
        private String service;

        public String getAwb() { return awb; }
        public void setAwb(String awb) { this.awb = awb; }
        public String getCourier() { return courier; }
        public void setCourier(String courier) { this.courier = courier; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getService() { return service; }
        public void setService(String service) { this.service = service; }
    }

    public static class Detail {
        private String origin;
        private String destination;
        private String shipper;
        private String receiver;

        public String getOrigin() { return origin; }
        public void setOrigin(String origin) { this.origin = origin; }
        public String getDestination() { return destination; }
        public void setDestination(String destination) { this.destination = destination; }
        public String getShipper() { return shipper; }
        public void setShipper(String shipper) { this.shipper = shipper; }
        public String getReceiver() { return receiver; }
        public void setReceiver(String receiver) { this.receiver = receiver; }
    }

    public static class History {
        private String date;
        private String desc;
        private String location;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getDesc() { return desc; }
        public void setDesc(String desc) { this.desc = desc; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
    }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Data getData() { return data; }
    public void setData(Data data) { this.data = data; }
}
