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

    public TrackingService() {
        this.restTemplate = new RestTemplate();
    }

    public TrackingResponseDTO trackPackage(String courier, String awb) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/track")
                .queryParam("api_key", apiKey)
                .queryParam("courier", courier)
                .queryParam("awb", awb)
                .toUriString();

        return restTemplate.getForObject(url, TrackingResponseDTO.class);
    }
}
