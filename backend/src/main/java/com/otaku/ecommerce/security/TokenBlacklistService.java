package com.otaku.ecommerce.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * TokenBlacklistService — Menyimpan Access Token yang di-logout / di-revoke ke
 * Redis.
 * Token yang ada di Redis dianggap tidak valid meskipun signature-nya masih
 * benar.
 */
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private static final String BLACKLIST_PREFIX = "blacklist:token:";
    private static final String FORCE_LOGOUT_PREFIX = "blacklist:user:";

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    /**
     * Tambahkan jti (JWT ID) ke blacklist Redis dengan TTL sesuai sisa umur token.
     */
    public void blacklistJti(String jti, long ttlMillis) {
        if (jti == null || ttlMillis <= 0) return;
        try {
            String key = BLACKLIST_PREFIX + jti;
            redisTemplate.opsForValue().set(key, "1", ttlMillis, TimeUnit.MILLISECONDS);
            log.info("[BLACKLIST] JTI {} di-blacklist, TTL={}ms", jti, ttlMillis);
        } catch (Exception e) {
            log.error("[BLACKLIST-ERROR] Gagal blacklist JTI: {}", e.getMessage());
        }
    }

    /**
     * Cek apakah JTI ada di blacklist.
     */
    public boolean isJtiBlacklisted(String jti) {
        if (jti == null) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
        } catch (Exception e) {
            log.error("[BLACKLIST-ERROR] Gagal cek blacklist JTI: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Force logout user — tandai userId di Redis agar semua token lama ditolak.
     * TTL: 24 jam (sama dengan max umur access token yang mungkin masih aktif).
     */
    @SuppressWarnings("null")
    public void forceLogoutUser(Integer userId) {
        if (userId == null)
            return;
        try {
            String key = FORCE_LOGOUT_PREFIX + userId;
            String timestamp = String.valueOf(System.currentTimeMillis());
            redisTemplate.opsForValue().set(key, timestamp, 24, TimeUnit.HOURS);
            log.info("[FORCE-LOGOUT] User {} di-force-logout via Redis", userId);
        } catch (Exception e) {
            log.error("[FORCE-LOGOUT-ERROR] Gagal force logout user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Cek apakah user sedang dalam status force-logout.
     */
    public boolean isForceLoggedOut(Integer userId) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(FORCE_LOGOUT_PREFIX + userId));
        } catch (Exception e) {
            log.error("[FORCE-LOGOUT-ERROR] Gagal cek force logout: {}", e.getMessage());
            return false;
        }
    }
}
