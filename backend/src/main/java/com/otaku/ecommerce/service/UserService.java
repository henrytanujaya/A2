package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.UserDTO;
import com.otaku.ecommerce.entity.User;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired private UserRepository userRepository;

    // ─── Get All Users (Admin) ────────────────────────────────────────────────
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ─── Get User by ID (Admin) ───────────────────────────────────────────────
    public UserDTO getUserById(Integer id) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));
        return toDTO(user);
    }

    // ─── Change Role (Admin) ──────────────────────────────────────────────────
    public UserDTO changeRole(Integer id, String newRole) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        if (!List.of("Customer", "Admin").contains(newRole))
            throw new CustomBusinessException("OTK-4010", "Role tidak valid. Gunakan 'Customer' atau 'Admin'.", 400);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));
        user.setRole(newRole);
        return toDTO(userRepository.save(user));
    }

    // ─── Deactivate User (Admin) ──────────────────────────────────────────────
    public void deactivateUser(Integer id) {
        if (id == null) throw new CustomBusinessException("OTK-4010", "ID tidak boleh kosong", 400);
        if (!userRepository.existsById(id))
            throw new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404);
        userRepository.deleteById(id);
    }

    // ─── Get Profile by Email ─────────────────────────────────────────────────
    public UserDTO getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));
        return toDTO(user);
    }

    // ─── Update Profile ───────────────────────────────────────────────────────
    public UserDTO updateProfile(String email, com.otaku.ecommerce.dto.UserProfileUpdateRequestDTO request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));
        
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        return toDTO(userRepository.save(user));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────
    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        return dto;
    }
}
