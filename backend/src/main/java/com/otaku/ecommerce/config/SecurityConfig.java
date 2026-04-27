package com.otaku.ecommerce.config;

import com.otaku.ecommerce.security.JwtAuthenticationFilter;
import com.otaku.ecommerce.security.RateLimitFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Aktifkan @PreAuthorize per-method
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json");
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: Token invalid atau expired.\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // ─── Public (Tanpa Auth) ─────────────────────────────
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/error", "/uploads/**").permitAll()
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/payments/webhook").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/discounts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/shipping/**").permitAll()
                        // ─── Swagger / OpenAPI ───
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // ─── Admin Only ───────────────────────────────────────
                        .requestMatchers("/api/v1/admin/**").hasRole("Admin")
                        .requestMatchers(HttpMethod.POST, "/api/v1/products").hasRole("Admin")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/products/**").hasRole("Admin")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/products/**").hasRole("Admin")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/products/**").hasRole("Admin")
                        .requestMatchers(HttpMethod.POST, "/api/v1/discounts").hasRole("Admin")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/discounts/**").hasRole("Admin")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/discounts/**").hasRole("Admin")
                        // ─── Customer + Admin ─────────────────────────────────
                        .requestMatchers("/api/v1/orders/all").hasRole("Admin")
                        .requestMatchers("/api/v1/orders/**").hasAnyRole("Customer", "Admin")
                        .requestMatchers("/api/v1/custom-orders/**").hasAnyRole("Customer", "Admin")
                        .requestMatchers("/api/v1/tripo/**").hasAnyRole("Customer", "Admin")
                        .requestMatchers("/api/v1/upload/**").hasAnyRole("Customer", "Admin")
                        .requestMatchers("/api/v1/tracking/**").hasAnyRole("Customer", "Admin")
                        // ─── Semua yang lain wajib auth ───────────────────────
                        .anyRequest().authenticated())
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com; connect-src 'self' https://api.xendit.co https://api.binderbyte.com https://api.tripo3d.ai;")
                        )
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)
                        )
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt dengan strength 12 (lebih aman dari default 10)
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", "Cache-Control", "Content-Type",
                "X-Requested-With", "Accept", "Origin",
                "X-Guest-ID"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Guest-ID"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight 1 jam
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
