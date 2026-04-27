package com.otaku.ecommerce.service;

import com.otaku.ecommerce.exception.CustomBusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class TripoService {

    private static final Logger log = LoggerFactory.getLogger(TripoService.class);

    @Value("${tripo.api-key}")
    private String tripoApiKey;

    @Autowired
    private RestTemplate restTemplate;

    private static final String TRIPO_API_URL = "https://api.tripo3d.ai/v2/openapi/task";

    /**
     * Memulai tugas Image-to-3D di Tripo AI
     */
    @SuppressWarnings("unchecked")
    public String createTask(String imageUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + tripoApiKey);

            Map<String, Object> file = new HashMap<>();
            file.put("type", "jpg");
            file.put("url", imageUrl);

            Map<String, Object> body = new HashMap<>();
            body.put("type", "image_to_model");
            body.put("file", file);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            
            Map<String, Object> response = restTemplate.postForObject(TRIPO_API_URL, entity, Map.class);

            if (response != null && Integer.valueOf(0).equals(response.get("code"))) {
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                String taskId = (String) data.get("task_id");
                log.info("[TRIPO] Task created successfully: {}", taskId);
                return taskId;
            } else {
                String msg = response != null ? String.valueOf(response.get("message")) : "Unknown error";
                throw new RuntimeException("Tripo AI Error: " + msg);
            }
        } catch (Exception e) {
            log.error("[TRIPO-ERR] Failed to create task: {}", e.getMessage());
            throw new CustomBusinessException("OTK-500", "Gagal menghubungi Tripo AI: " + e.getMessage(), 500);
        }
    }

    /**
     * Mengecek status tugas berdasarkan taskId
     */
    public Map<String, Object> getTaskStatus(String taskId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + tripoApiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            @SuppressWarnings("null")
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                TRIPO_API_URL + "/" + taskId,
                HttpMethod.GET,
                entity,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> body = response.getBody();
            if (body != null && Integer.valueOf(0).equals(body.get("code"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) body.get("data");
                return data;
            } else {
                throw new RuntimeException("Gagal mengambil status dari Tripo");
            }
        } catch (Exception e) {
            log.error("[TRIPO-ERR] Polling failed for task {}: {}", taskId, e.getMessage());
            throw new CustomBusinessException("OTK-500", "Gagal mengecek status AI: " + e.getMessage(), 500);
        }
    }
}
