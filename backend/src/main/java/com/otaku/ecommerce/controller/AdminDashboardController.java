package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.AdminDashboardResponseDTO;
import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    @Autowired
    private AdminDashboardService adminDashboardService;

    @GetMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<AdminDashboardResponseDTO>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success("OTK-8010", "Data dashboard berhasil diambil", adminDashboardService.getDashboardData()));
    }
}
