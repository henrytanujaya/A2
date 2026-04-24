package com.otaku.ecommerce.controller;

import com.otaku.ecommerce.dto.ApiResponse;
import com.otaku.ecommerce.dto.CartItemDTO;
import com.otaku.ecommerce.dto.CartRequestDTO;
import com.otaku.ecommerce.dto.CartSyncRequestDTO;
import com.otaku.ecommerce.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    // ─── Guest Endpoints (Membutuhkan header X-Guest-ID) ──────────────────────

    @GetMapping("/guest")
    public ResponseEntity<ApiResponse<List<CartItemDTO>>> getGuestCart(
            @RequestHeader("X-Guest-ID") String guestId) {
        List<CartItemDTO> cart = cartService.getGuestCart(guestId);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Guest cart retrieved", cart));
    }

    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<Void>> addGuestCartItem(
            @RequestHeader("X-Guest-ID") String guestId,
            @Valid @RequestBody CartRequestDTO request) {
        cartService.addGuestCartItem(guestId, request);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Item added to guest cart", null));
    }

    @PutMapping("/guest/{cartItemId}")
    public ResponseEntity<ApiResponse<Void>> updateGuestCartItem(
            @RequestHeader("X-Guest-ID") String guestId,
            @PathVariable Integer cartItemId,
            @RequestBody CartRequestDTO request) {
        cartService.updateGuestCartItemQuantity(guestId, cartItemId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Guest cart item updated", null));
    }

    @DeleteMapping("/guest/{cartItemId}")
    public ResponseEntity<ApiResponse<Void>> removeGuestCartItem(
            @RequestHeader("X-Guest-ID") String guestId,
            @PathVariable Integer cartItemId) {
        cartService.removeGuestCartItem(guestId, cartItemId);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Item removed from guest cart", null));
    }

    @DeleteMapping("/guest")
    public ResponseEntity<ApiResponse<Void>> clearGuestCart(
            @RequestHeader("X-Guest-ID") String guestId) {
        cartService.clearGuestCart(guestId);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Guest cart cleared", null));
    }

    // ─── User Endpoints (Membutuhkan Bearer Token) ────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<List<CartItemDTO>>> getUserCart(Authentication auth) {
        List<CartItemDTO> cart = cartService.getUserCart(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "User cart retrieved", cart));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<Void>> addUserCartItem(
            Authentication auth,
            @Valid @RequestBody CartRequestDTO request) {
        cartService.addUserCartItem(auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Item added to cart", null));
    }

    @PutMapping("/{cartItemId}")
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<Void>> updateUserCartItem(
            Authentication auth,
            @PathVariable Integer cartItemId,
            @RequestBody CartRequestDTO request) {
        cartService.updateUserCartItemQuantity(auth.getName(), cartItemId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Cart item updated", null));
    }

    @DeleteMapping("/{cartItemId}")
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<Void>> removeUserCartItem(
            Authentication auth,
            @PathVariable Integer cartItemId) {
        cartService.removeUserCartItem(auth.getName(), cartItemId);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Item removed from cart", null));
    }

    @DeleteMapping
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<Void>> clearUserCart(Authentication auth) {
        cartService.clearUserCart(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "User cart cleared", null));
    }

    // ─── Sync Endpoint ────────────────────────────────────────────────────────

    @PostMapping("/sync")
    @PreAuthorize("hasAnyRole('Customer', 'Admin')")
    public ResponseEntity<ApiResponse<Void>> syncCart(
            Authentication auth,
            @Valid @RequestBody CartSyncRequestDTO request) {
        cartService.syncGuestCartToUser(auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("OTK-200", "Guest cart synced to user account", null));
    }
}
