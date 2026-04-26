package com.otaku.ecommerce.dto;

public class BiteshipWebhookDTO {
    private String event;
    private String waybill_id;
    private String courier_tracking_id;
    private String courier_waybill_id;
    private String status;
    private String note;

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public String getWaybill_id() { return waybill_id; }
    public void setWaybill_id(String waybill_id) { this.waybill_id = waybill_id; }
    public String getCourier_tracking_id() { return courier_tracking_id; }
    public void setCourier_tracking_id(String courier_tracking_id) { this.courier_tracking_id = courier_tracking_id; }
    public String getCourier_waybill_id() { return courier_waybill_id; }
    public void setCourier_waybill_id(String courier_waybill_id) { this.courier_waybill_id = courier_waybill_id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
