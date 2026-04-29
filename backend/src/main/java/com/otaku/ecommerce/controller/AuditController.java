package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.SalesAuditResponseDTO;
import com.otaku.ecommerce.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {

    @Autowired
    private AuditService auditService;

    @GetMapping("/sales")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<ApiResponse<SalesAuditResponseDTO>> getSalesAudit(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        int finalMonth = (month == null) ? LocalDate.now().getMonthValue() : month;
        int finalYear = (year == null) ? LocalDate.now().getYear() : year;

        SalesAuditResponseDTO auditData = auditService.getMonthlySalesReport(finalMonth, finalYear);
        return ResponseEntity.ok(ApiResponse.success("OTK-6001", "Data audit penjualan berhasil diambil", auditData));
    }
}
