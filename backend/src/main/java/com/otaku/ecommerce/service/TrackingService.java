package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.TrackingResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class TrackingService {

    @Value("${binderbyte.api-key}")
    private String apiKey;

    @Value("${binderbyte.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate;

    public TrackingService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public TrackingResponseDTO trackPackage(String courier, String awb) {
        // --- Simulasi untuk testing (MOCK MODE) ---
        if (awb != null && awb.startsWith("MOCK")) {
            TrackingResponseDTO mock = new TrackingResponseDTO();
            mock.setStatus(200);
            mock.setMessage("Simulated tracking data");
            
            TrackingResponseDTO.Data data = new TrackingResponseDTO.Data();
            
            TrackingResponseDTO.Summary summary = new TrackingResponseDTO.Summary();
            summary.setAwb("MOCK123");
            summary.setCourier("J&T (Mock)");
            summary.setStatus("DELIVERED");
            summary.setDate("2026-04-24 10:00:00");
            summary.setService("Reguler");
            data.setSummary(summary);
            
            java.util.List<TrackingResponseDTO.History> history = new java.util.ArrayList<>();
            
            TrackingResponseDTO.History h1 = new TrackingResponseDTO.History();
            h1.setDate("2026-04-24 10:00:00");
            h1.setDesc("Paket telah diterima oleh [Tanuj]");
            h1.setLocation("Jakarta");
            history.add(h1);
            
            TrackingResponseDTO.History h2 = new TrackingResponseDTO.History();
            h2.setDate("2026-04-24 08:30:00");
            h2.setDesc("Paket sedang dibawa kurir (On Delivery)");
            h2.setLocation("Jakarta Pusat");
            history.add(h2);

            TrackingResponseDTO.History h3 = new TrackingResponseDTO.History();
            h3.setDate("2026-04-23 21:00:00");
            h3.setDesc("Paket telah sampai di Warehouse Jakarta");
            h3.setLocation("Jakarta");
            history.add(h3);

            data.setHistory(history);
            mock.setData(data);
            return mock;
        }

        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/track")
                .queryParam("api_key", apiKey)
                .queryParam("courier", courier)
                .queryParam("awb", awb)
                .toUriString();

        return restTemplate.getForObject(url, TrackingResponseDTO.class);
    }
}
