package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.CustomOrderRequestDTO;
import com.otaku.ecommerce.dto.CustomOrderResponseDTO;
import com.otaku.ecommerce.entity.CustomOrder;
import com.otaku.ecommerce.entity.User;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.CustomOrderRepository;
import com.otaku.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomOrderService {

    private static final Logger log = LoggerFactory.getLogger(CustomOrderService.class);

    @Autowired private CustomOrderRepository customOrderRepository;
    @Autowired private UserRepository        userRepository;

    // ─── Create Custom Order (userId dari JWT, BUKAN dari body) ──────────────
    @Transactional
    public CustomOrderResponseDTO createCustomOrder(CustomOrderRequestDTO request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));

        CustomOrder customOrder = new CustomOrder();
        customOrder.setUser(user);
        customOrder.setServiceType(request.getServiceType());
        customOrder.setImageReferenceUrl(request.getImageReferenceUrl());
        customOrder.setConfigurationJson(request.getConfigurationJson());
        
        // Otomatis jadi Quoted jika harga dikirim (agar bisa langsung dibayar)
        if (request.getPrice() != null) {
            customOrder.setPrice(request.getPrice());
            customOrder.setStatus("Quoted");
        } else {
            customOrder.setPrice(null);
            customOrder.setStatus("Pending Review");
        }
        
        customOrder.setCreatedAt(LocalDateTime.now());

        CustomOrder saved = customOrderRepository.save(customOrder);
        log.info("[CUSTOM-ORDER] Custom order {} dibuat dengan status {} oleh userId={}", 
                 saved.getId(), saved.getStatus(), user.getId());
        return toDTO(saved);
    }

    // ─── Get Custom Orders milik sendiri (Customer) ───────────────────────────
    public List<CustomOrderResponseDTO> getMyCustomOrders(String userEmail) {
        return customOrderRepository.findByUserEmail(userEmail)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Get All Custom Orders (Admin) ────────────────────────────────────────
    public List<CustomOrderResponseDTO> getAllCustomOrders() {
        return customOrderRepository.findAll()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Admin: Tetapkan Harga ────────────────────────────────────────────────
    @Transactional
    public CustomOrderResponseDTO setPrice(Integer id, BigDecimal price) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        CustomOrder co = customOrderRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException("OTK-4045", "Custom order tidak ditemukan", 404));

        co.setPrice(price);
        co.setStatus("Quoted");
        CustomOrder saved = customOrderRepository.save(co);
        log.info("[CUSTOM-ORDER-PRICE] Custom order {} di-quote harga={}", id, price);
        return toDTO(saved);
    }

    // ─── Admin: Update Status ─────────────────────────────────────────────────
    @Transactional
    public CustomOrderResponseDTO updateStatus(Integer id, String newStatus) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        CustomOrder co = customOrderRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException("OTK-4045", "Custom order tidak ditemukan", 404));
        co.setStatus(newStatus);
        return toDTO(customOrderRepository.save(co));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────
    private CustomOrderResponseDTO toDTO(CustomOrder co) {
        CustomOrderResponseDTO dto = new CustomOrderResponseDTO();
        dto.setId(co.getId());
        if (co.getUser() != null) dto.setUserId(co.getUser().getId());
        dto.setServiceType(co.getServiceType());
        dto.setImageReferenceUrl(co.getImageReferenceUrl());
        dto.setConfigurationJson(co.getConfigurationJson());
        dto.setPrice(co.getPrice());
        dto.setStatus(co.getStatus());
        dto.setCreatedAt(co.getCreatedAt());
        return dto;
    }
}
