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
        // --- Simulasi untuk testing (MOCK MODE / Demo Biteship) ---
        if (awb != null && (awb.startsWith("MOCK") || awb.startsWith("WYB") || awb.startsWith("BSTST"))) {
            TrackingResponseDTO mock = new TrackingResponseDTO();
            mock.setStatus(200);
            mock.setMessage("Simulated tracking data");
            
            TrackingResponseDTO.Data data = new TrackingResponseDTO.Data();
            
            TrackingResponseDTO.Summary summary = new TrackingResponseDTO.Summary();
            summary.setAwb(awb);
            summary.setCourier((courier != null ? courier.toUpperCase() : "Kurir") + " (Mock)");
            summary.setStatus("DELIVERED");
            summary.setDate("2026-04-30 10:00:00");
            summary.setService("Reguler");
            data.setSummary(summary);
            
            java.util.List<TrackingResponseDTO.History> history = new java.util.ArrayList<>();
            
            TrackingResponseDTO.History h1 = new TrackingResponseDTO.History();
            h1.setDate("2026-04-30 10:00:00");
            h1.setDesc("Paket telah diterima oleh [Customer/Admin]");
            h1.setLocation("Tujuan");
            history.add(h1);
            
            TrackingResponseDTO.History h2 = new TrackingResponseDTO.History();
            h2.setDate("2026-04-30 08:30:00");
            h2.setDesc("Paket sedang dibawa kurir (On Delivery)");
            h2.setLocation("Hub Terdekat");
            history.add(h2);

            TrackingResponseDTO.History h3 = new TrackingResponseDTO.History();
            h3.setDate("2026-04-29 21:00:00");
            h3.setDesc("Paket telah sampai di Warehouse Logistik");
            h3.setLocation("Hub Logistik");
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
