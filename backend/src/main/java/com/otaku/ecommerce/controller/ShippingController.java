package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.ShippingAreaDTO;
import com.otaku.ecommerce.dto.ShippingRateDTO;
import com.otaku.ecommerce.service.ShippingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/shipping")
public class ShippingController {

    @Autowired
    private ShippingService shippingService;

    /**
     * Pencarian area/kota berdasarkan kata kunci.
     * Contoh: GET /api/v1/shipping/areas?query=bandung
     */
    @GetMapping("/areas")
    public ResponseEntity<ApiResponse<ShippingAreaDTO>> searchAreas(@RequestParam String query) {
        if (query == null || query.trim().length() < 3) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("OTK-4000", "Query pencarian minimal 3 karakter"));
        }
        ShippingAreaDTO response = shippingService.searchAreas(query.trim());
        return ResponseEntity.ok(ApiResponse.success("OTK-3001", "Pencarian area berhasil", response));
    }

    /**
     * Menghitung tarif ongkos kirim.
     * Contoh: GET /api/v1/shipping/cost?destination=JKT-UTR-CLN&weight=1500&courier=jne
     */
    @GetMapping("/cost")
    public ResponseEntity<ApiResponse<ShippingRateDTO>> getCost(
            @RequestParam String destination,
            @RequestParam(defaultValue = "500") Integer weight,
            @RequestParam(defaultValue = "") String courier) {

        ShippingRateDTO rates = shippingService.getShippingCost(destination, weight, courier);
        return ResponseEntity.ok(ApiResponse.success("OTK-3002", "Tarif pengiriman berhasil dihitung", rates));
    }
}
