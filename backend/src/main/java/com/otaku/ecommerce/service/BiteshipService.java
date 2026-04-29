package com.otaku.ecommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otaku.ecommerce.entity.Order;
import com.otaku.ecommerce.entity.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BiteshipService {

    private static final Logger log = LoggerFactory.getLogger(BiteshipService.class);

    @Value("${biteship.api-key}")
    private String apiKey;

    @Value("${biteship.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public BiteshipService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String createOrder(Order order) {
        try {
            String url = baseUrl + "/orders";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("shipper_contact_name", "Admin Otaku Store");
            body.put("shipper_contact_phone", "081234567890");
            body.put("shipper_contact_email", "admin@otakustore.com");
            body.put("shipper_organization", "Otaku Store");
            
            // Hardcoded Origin as requested: Jakarta Utara, Cilincing, Kalibaru
            body.put("origin_contact_name", "Admin Otaku Store");
            body.put("origin_contact_phone", "081234567890");
            body.put("origin_address", "Kalibaru, Cilincing, Jakarta Utara");
            body.put("origin_area_id", "IDNP6IDNC150IDND881IDZ14110"); // Area ID for Kalibaru, Cilincing

            // Destination
            String custName = order.getUser().getName();
            if (custName == null || custName.trim().isEmpty()) custName = "Customer";
            
            String custPhone = order.getUser().getPhone();
            if (custPhone == null || custPhone.trim().isEmpty()) custPhone = "080000000000";
            
            body.put("destination_contact_name", custName);
            body.put("destination_contact_phone", custPhone);
            body.put("destination_address", order.getShippingAddress());
            // Hardcode destination area ID for testing because we don't save area ID in Order entity
            body.put("destination_area_id", "IDNP6IDNC150IDND881IDZ14110"); 
            
            body.put("courier_company", order.getCourierCode() != null ? order.getCourierCode().toLowerCase() : "jne");
            body.put("courier_type", "reg");
            body.put("delivery_type", "now");

            List<Map<String, Object>> items = new ArrayList<>();
            for (OrderItem item : order.getItems()) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("name", item.getProduct() != null ? item.getProduct().getName() : "Custom Item");
                itemMap.put("description", "Anime Merchandise");
                itemMap.put("value", item.getUnitPrice() != null ? item.getUnitPrice().intValue() : 10000);
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("weight", 500); // hardcode 500g per item for testing
                items.add(itemMap);
            }
            body.put("items", items);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(url, request, String.class);

            JsonNode root = objectMapper.readTree(response);
            if (root.has("success") && root.get("success").asBoolean()) {
                JsonNode courierNode = root.get("courier");
                if (courierNode != null && courierNode.has("waybill_id")) {
                    String waybill = courierNode.get("waybill_id").asText();
                    log.info("[BITESHIP] Berhasil membuat order. Waybill: {}", waybill);
                    return waybill;
                }
            } else {
                log.error("[BITESHIP] Gagal membuat order. Response: {}", response);
            }
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("[BITESHIP] Http API Error Create Order: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("[BITESHIP] Error memanggil API Create Order: {}", e.getMessage());
        }
        return null;
    }
}
