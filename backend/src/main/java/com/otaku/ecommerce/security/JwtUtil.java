package com.otaku.ecommerce.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

/**
 * JwtUtil — Diperbarui ke JJWT 0.12.3 API.
 * Mendukung dual token: Access Token (15 menit) dan Refresh Token (7 hari).
 * Secret key diambil dari environment variable ${JWT_SECRET} — tidak hardcoded.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKeyString;

    @Value("${jwt.access-token-expiration:900000}")
    private long accessTokenExpiration; // 15 menit default

    @Value("${jwt.refresh-token-expiration:604800000}")
    private long refreshTokenExpiration; // 7 hari default

    private SecretKey getSignKey() {
        byte[] keyBytes = secretKeyString.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ─── Access Token (15 menit) ──────────────────────────────────────────────
    public String generateAccessToken(Integer userId, String email, String role) {
        return Jwts.builder()
                .subject(email)
                .id(java.util.UUID.randomUUID().toString()) // jti
                .claim("userId", userId)
                .claim("role", role)
                .claim("type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSignKey())
                .compact();
    }

    // ─── Refresh Token (7 hari) ───────────────────────────────────────────────
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
                .signWith(getSignKey())
                .compact();
    }

    // ─── Validasi Token ───────────────────────────────────────────────────────
    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSignKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // ─── Ekstrak Data ─────────────────────────────────────────────────────────
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public Integer extractUserId(String token) {
        return (Integer) extractAllClaims(token).get("userId");
    }

    public String extractRole(String token) {
        return (String) extractAllClaims(token).get("role");
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
