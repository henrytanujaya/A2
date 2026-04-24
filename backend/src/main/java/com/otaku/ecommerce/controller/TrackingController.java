package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.TrackingResponseDTO;
import com.otaku.ecommerce.service.TrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tracking")
public class TrackingController {

    @Autowired
    private TrackingService trackingService;

    @GetMapping("/{courier}/{awb}")
    public ResponseEntity<ApiResponse<TrackingResponseDTO>> getTracking(
            @PathVariable String courier,
            @PathVariable String awb) {
        
        try {
            TrackingResponseDTO result = trackingService.trackPackage(courier, awb);
            if (result != null && result.getStatus() == 200) {
                return ResponseEntity.ok(new ApiResponse<>(true, "TRACK_SUCCESS", "Tracking data retrieved successfully", result));
            } else {
                String message = (result != null) ? result.getMessage() : "Failed to retrieve tracking data";
                return ResponseEntity.status(400).body(new ApiResponse<>(false, "TRACK_ERROR", message, null));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "SERVER_ERROR", "Error: " + e.getMessage(), null));
        }
    }
}
