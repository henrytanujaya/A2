package com.otaku.ecommerce.dto;

import java.util.List;

public class BiteshipRateRequestDTO {
    private String origin_area_id;
    private String destination_area_id;
    private String couriers;
    private List<Item> items;

    public String getOrigin_area_id() { return origin_area_id; }
    public void setOrigin_area_id(String origin_area_id) { this.origin_area_id = origin_area_id; }
    public String getDestination_area_id() { return destination_area_id; }
    public void setDestination_area_id(String destination_area_id) { this.destination_area_id = destination_area_id; }
    public String getCouriers() { return couriers; }
    public void setCouriers(String couriers) { this.couriers = couriers; }
    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = items; }

    public static class Item {
        private String name;
        private int weight; // gram
        private long value; // harga

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getWeight() { return weight; }
        public void setWeight(int weight) { this.weight = weight; }
        public long getValue() { return value; }
        public void setValue(long value) { this.value = value; }
    }
}
