package com.otaku.ecommerce.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RateLimitFilter — Proteksi DDoS & brute-force dengan bucket4j.
 * - Login & Register: 5 request / 1 menit per IP
 * - Upload: 5 request / 10 menit per IP
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Pisahkan bucket per jenis endpoint
    private final Map<String, Bucket> loginCache  = new ConcurrentHashMap<>();
    private final Map<String, Bucket> uploadCache = new ConcurrentHashMap<>();

    private Bucket createLoginBucket() {
        // 5 request per 1 menit
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))))
                .build();
    }

    private Bucket createUploadBucket() {
        // 5 upload per 10 menit (lebih longgar, upload lebih lambat)
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(10))))
                .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isEmpty())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }

    private void writeRateLimitResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
            "{\"success\":false,\"internalCode\":\"OTK-4290\",\"message\":\"" + message + "\"}"
        );
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String uri      = request.getRequestURI();
        String clientIp = resolveClientIp(request);

        // ─── Rate limit Login & Register ─────────────────────────────────────
        if (uri.startsWith("/api/v1/auth/login") || uri.startsWith("/api/v1/auth/register")) {
            Bucket bucket = loginCache.computeIfAbsent(clientIp, k -> createLoginBucket());
            if (!bucket.tryConsume(1)) {
                writeRateLimitResponse(response, "Terlalu banyak percobaan. Coba lagi dalam 1 menit.");
                return;
            }
        }

        // ─── Rate limit Upload ────────────────────────────────────────────────
        if (uri.startsWith("/api/v1/upload/")) {
            Bucket bucket = uploadCache.computeIfAbsent(clientIp, k -> createUploadBucket());
            if (!bucket.tryConsume(1)) {
                writeRateLimitResponse(response, "Batas upload tercapai (5 file per 10 menit). Coba lagi nanti.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
