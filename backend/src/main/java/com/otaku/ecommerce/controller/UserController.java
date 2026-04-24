package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.UserDTO;
import com.otaku.ecommerce.dto.UserProfileUpdateRequestDTO;
import com.otaku.ecommerce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/profile")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserDTO>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        UserDTO userDTO = userService.getProfileByEmail(email);
        return ResponseEntity.ok(ApiResponse.success("OTK-2055", "Profil berhasil diambil", userDTO));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            Authentication authentication,
            @RequestBody UserProfileUpdateRequestDTO request) {
        String email = authentication.getName();
        UserDTO updatedUser = userService.updateProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("OTK-2056", "Profil berhasil diperbarui", updatedUser));
    }
}
