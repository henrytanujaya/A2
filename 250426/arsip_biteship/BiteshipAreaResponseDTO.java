package com.otaku.ecommerce.dto;

import java.util.List;

public class BiteshipAreaResponseDTO {
    private boolean success;
    private String error;
    private String object;
    private List<BiteshipArea> areas;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
    public String getObject() { return object; }
    public void setObject(String object) { this.object = object; }
    public List<BiteshipArea> getAreas() { return areas; }
    public void setAreas(List<BiteshipArea> areas) { this.areas = areas; }

    public static class BiteshipArea {
        private String id;
        private String name;
        private String type;
        private String country;
        private String area_level;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public String getArea_level() { return area_level; }
        public void setArea_level(String area_level) { this.area_level = area_level; }
    }
}
