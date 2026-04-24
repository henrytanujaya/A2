package com.otaku.ecommerce.service;

import com.otaku.ecommerce.dto.LoginRequestDTO;
import com.otaku.ecommerce.dto.RegisterRequestDTO;
import com.otaku.ecommerce.dto.UserDTO;
import com.otaku.ecommerce.entity.RefreshToken;
import com.otaku.ecommerce.entity.User;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.RefreshTokenRepository;
import com.otaku.ecommerce.repository.UserRepository;
import com.otaku.ecommerce.security.JwtUtil;
import com.otaku.ecommerce.security.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // Regex: minimal 8 karakter, 1 huruf besar, 1 kecil, 1 angka, 1 simbol
    private static final String PASSWORD_PATTERN =
            "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";
    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);

    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TokenBlacklistService tokenBlacklistService;

    // ─── Login ────────────────────────────────────────────────────────────────
    public Map<String, Object> login(LoginRequestDTO dto, HttpServletRequest request) {
        // Satu query findByEmail — tidak double query
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> {
                    log.warn("[AUTH-FAIL] Login gagal untuk email={} dari IP={}", dto.getEmail(), request.getRemoteAddr());
                    return new CustomBusinessException("OTK-4001", "Email atau password salah", 401);
                });

        // A02: BCrypt murni — bukan kombinasi name+password+email
        boolean valid;
        try {
            valid = passwordEncoder.matches(dto.getPassword(), user.getPasswordHash());
        } catch (Exception e) {
            log.error("[AUTH-ERROR] BCrypt error untuk email={}: {}", dto.getEmail(), e.getMessage());
            throw new CustomBusinessException("OTK-4001", "Email atau password salah", 401);
        }

        if (!valid) {
            log.warn("[AUTH-FAIL] Password salah untuk email={} dari IP={}", dto.getEmail(), request.getRemoteAddr());
            throw new CustomBusinessException("OTK-4001", "Email atau password salah", 401);
        }

        // Buat Access Token (15 menit) & Refresh Token (7 hari)
        String accessToken  = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // Simpan refresh token ke DB (revoke semua yang lama terlebih dahulu)
        saveRefreshToken(user, refreshToken);

        log.info("[AUTH-OK] Login berhasil untuk userId={} dari IP={}", user.getId(), request.getRemoteAddr());

        UserDTO userDto = toUserDTO(user);
        return Map.of(
            "accessToken",  accessToken,
            "refreshToken", refreshToken,
            "tokenType",    "Bearer",
            "expiresIn",    900,
            "user",         userDto
        );
    }

    // ─── Register ─────────────────────────────────────────────────────────────
    public void register(RegisterRequestDTO dto) {
        if (!pattern.matcher(dto.getPassword()).matches()) {
            throw new CustomBusinessException("OTK-4012",
                "Password lemah! Minimal 8 karakter, ada angka, huruf besar, huruf kecil, dan simbol.", 400);
        }

        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new CustomBusinessException("OTK-4006", "Email sudah terdaftar", 409);
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole("Customer");
        user.setCreatedAt(LocalDateTime.now());

        // A02: BCrypt murni tanpa kombinasi non-standard
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        userRepository.save(user);
    }

    // ─── Refresh Token ────────────────────────────────────────────────────────
    @Transactional
    public Map<String, Object> refreshToken(String refreshTokenStr) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new CustomBusinessException("OTK-4005", "Refresh token tidak valid", 401));

        if (storedToken.getRevoked()) {
            throw new CustomBusinessException("OTK-4005", "Refresh token sudah dicabut", 401);
        }
        if (storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new CustomBusinessException("OTK-4005", "Refresh token sudah kadaluarsa", 401);
        }

        User user = storedToken.getUser();

        // Rotation: revoke semua token lama user, buat baru
        refreshTokenRepository.revokeAllByUserId(user.getId());

        String newAccessToken  = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        saveRefreshToken(user, newRefreshToken);

        log.info("[TOKEN-REFRESH] Token di-rotate untuk userId={}", user.getId());

        return Map.of(
            "accessToken",  newAccessToken,
            "refreshToken", newRefreshToken,
            "tokenType",    "Bearer",
            "expiresIn",    900
        );
    }

    // ─── Logout ───────────────────────────────────────────────────────────────
    @Transactional
    public void logout(String accessToken, Integer userId) {
        // Extract JTI and Expiration
        String jti = jwtUtil.extractJti(accessToken);
        java.util.Date expiry = jwtUtil.extractExpiration(accessToken);
        long ttl = expiry.getTime() - System.currentTimeMillis();

        // Blacklist JTI di Redis (TTL = sisa umur token)
        tokenBlacklistService.blacklistJti(jti, ttl);

        // Revoke semua refresh token user di database
        refreshTokenRepository.revokeAllByUserId(userId);

        log.info("[LOGOUT] userId={} berhasil logout, JTI={} di-blacklist", userId, jti);
    }

    // ─── Force Logout (Admin action) ─────────────────────────────────────────
    @Transactional
    public void forceLogoutUser(Integer userId) {
        tokenBlacklistService.forceLogoutUser(userId);
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("[FORCE-LOGOUT] Admin force-logout userId={}", userId);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    @Transactional
    protected void saveRefreshToken(User user, String tokenStr) {
        LocalDateTime expiryDate = LocalDateTime.now().plusDays(7);
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setToken(tokenStr);
        rt.setExpiryDate(expiryDate);
        rt.setRevoked(false);
        refreshTokenRepository.save(rt);
    }

    private UserDTO toUserDTO(User user) {
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

    // Dipakai oleh UserService untuk lookup
    public UserDTO findByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));
        return toUserDTO(user);
    }
}
