package com.otaku.ecommerce.dto;

import java.util.List;

/**
 * DTO internal untuk data area/kota pengiriman.
 * Tidak terikat pada API eksternal manapun.
 */
public class ShippingAreaDTO {
    private boolean success;
    private List<Area> areas;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public List<Area> getAreas() { return areas; }
    public void setAreas(List<Area> areas) { this.areas = areas; }

    public static class Area {
        private String id;
        private String name;
        private String province;
        private String city;
        private String district;
        private String postalCode;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getProvince() { return province; }
        public void setProvince(String province) { this.province = province; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getDistrict() { return district; }
        public void setDistrict(String district) { this.district = district; }
        public String getPostalCode() { return postalCode; }
        public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    }
}
