package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.BiteshipAreaResponseDTO;
import com.otaku.ecommerce.dto.BiteshipRateRequestDTO;
import com.otaku.ecommerce.dto.BiteshipRateResponseDTO;
import com.otaku.ecommerce.service.ShippingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/v1/shipping")
public class ShippingController {

    // Origin toko diset statis sesuai permintaan user
    private static final String ORIGIN_AREA_ID = "IDNP6IDNC150IDND881IDZ14110"; // Cilincing, Jakarta Utara

    @Autowired
    private ShippingService shippingService;

    @GetMapping("/areas")
    public ResponseEntity<ApiResponse<BiteshipAreaResponseDTO>> searchAreas(@RequestParam String query) {
        if (query == null || query.length() < 3) {
            return ResponseEntity.badRequest().body(ApiResponse.error("OTK-4000", "Query pencarian area minimal 3 karakter"));
        }
        BiteshipAreaResponseDTO response = shippingService.searchAreas(query);
        return ResponseEntity.ok(ApiResponse.success("OTK-3001", "Pencarian area berhasil", response));
    }

    @GetMapping("/cost")
    public ResponseEntity<ApiResponse<BiteshipRateResponseDTO>> getCost(
            @RequestParam String destination,
            @RequestParam Integer weight,
            @RequestParam String courier) {
        
        BiteshipRateRequestDTO request = new BiteshipRateRequestDTO();
        request.setOrigin_area_id(ORIGIN_AREA_ID);
        request.setDestination_area_id(destination);
        request.setCouriers(courier);
        
        BiteshipRateRequestDTO.Item item = new BiteshipRateRequestDTO.Item();
        item.setName("Pesanan Otaku E-Commerce");
        item.setWeight(weight);
        item.setValue(10000); // Default item value
        
        request.setItems(Collections.singletonList(item));

        BiteshipRateResponseDTO cost = shippingService.getShippingCost(request);
        return ResponseEntity.ok(ApiResponse.success("OTK-3002", "Biaya ongkir berhasil dihitung", cost));
    }
}
