package com.otaku.ecommerce.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JwtAuthenticationFilter — Validasi JWT dengan tiga lapis:
 * 1. Signature & expiration (JJWT)
 * 2. Blacklist check (Redis — token sudah di-logout?)
 * 3. Force-logout check (Redis — user di-force-logout oleh Admin?)
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @SuppressWarnings("null")
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        log.info("[JWT-DEBUG] Incoming request: {} {}, Authorization: {}", request.getMethod(), request.getRequestURI(), authHeader != null ? "Present" : "MISSING");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        // Layer 1: Validasi signature & expiration
        if (!jwtUtil.validateToken(jwt)) {
            log.warn("[JWT-INVALID] Token tidak valid dari IP={}", request.getRemoteAddr());
            filterChain.doFilter(request, response);
            return;
        }

        // Layer 2: Cek token blacklist (JTI check)
        String jti = jwtUtil.extractJti(jwt);
        if (tokenBlacklistService.isJtiBlacklisted(jti)) {
            log.warn("[JWT-REVOKED] Token (JTI={}) sudah di-revoke dari IP={}", jti, request.getRemoteAddr());
            filterChain.doFilter(request, response);
            return;
        }

        // Layer 3: Cek force-logout status (user di-force-logout oleh Admin?)
        Integer userId = jwtUtil.extractUserId(jwt);
        if (tokenBlacklistService.isForceLoggedOut(userId)) {
            log.warn("[JWT-FORCE-LOGOUT] User {} sedang dalam status force-logout dari IP={}", userId, request.getRemoteAddr());
            filterChain.doFilter(request, response);
            return;
        }

        String email = jwtUtil.extractEmail(jwt);
        String role  = jwtUtil.extractRole(jwt);
        
        Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
        log.info("[JWT-DEBUG] Extracted email: {}, role: {}, existingAuth: {}", email, role, existingAuth != null ? existingAuth.getClass().getSimpleName() : "null");

        if (email != null) {
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(email, null, Collections.singletonList(authority));
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            
            // Buat SecurityContext baru
            org.springframework.security.core.context.SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authToken);
            
            // Set ke Holder
            SecurityContextHolder.setContext(context);
            log.info("[JWT-SUCCESS] Authentication set for user: {}", email);
        }

        filterChain.doFilter(request, response);
    }
}
