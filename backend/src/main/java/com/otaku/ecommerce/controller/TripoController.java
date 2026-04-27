package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.service.TripoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tripo")
public class TripoController {

    @Autowired
    private TripoService tripoService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<String>> createTask(@RequestBody Map<String, String> request) {
        String imageUrl = request.get("imageUrl");
        String taskId = tripoService.createTask(imageUrl);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Tugas AI dimulai", taskId));
    }

    @GetMapping("/status/{taskId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(@PathVariable String taskId) {
        Map<String, Object> status = tripoService.getTaskStatus(taskId);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Status tugas AI", status));
    }
}
