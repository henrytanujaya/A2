package com.otaku.ecommerce.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otaku.ecommerce.dto.CartItemDTO;
import com.otaku.ecommerce.dto.CartRequestDTO;
import com.otaku.ecommerce.dto.CartSyncRequestDTO;
import com.otaku.ecommerce.entity.CartItem;
import com.otaku.ecommerce.entity.CustomOrder;
import com.otaku.ecommerce.entity.Product;
import com.otaku.ecommerce.entity.User;
import com.otaku.ecommerce.exception.CustomBusinessException;
import com.otaku.ecommerce.repository.CartItemRepository;
import com.otaku.ecommerce.repository.CustomOrderRepository;
import com.otaku.ecommerce.repository.ProductRepository;
import com.otaku.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class CartService {

    private static final String REDIS_CART_PREFIX = "guest_cart:";
    private static final long CART_TTL_DAYS = 7;

    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CustomOrderRepository customOrderRepository;
    @Autowired private RedisTemplate<String, String> redisTemplate;
    @Autowired private ObjectMapper objectMapper;

    // ─── Guest Cart (Redis) ───────────────────────────────────────────────────
    
    public List<CartItemDTO> getGuestCart(String guestId) {
        String key = REDIS_CART_PREFIX + guestId;
        String cartJson = redisTemplate.opsForValue().get(key);
        if (cartJson == null) return new ArrayList<>();
        try {
            return objectMapper.readValue(cartJson, new TypeReference<List<CartItemDTO>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }

    @SuppressWarnings("null")
    public void saveGuestCart(String guestId, List<CartItemDTO> cart) {
        String key = REDIS_CART_PREFIX + guestId;
        try {
            String cartJson = objectMapper.writeValueAsString(cart);
            redisTemplate.opsForValue().set(key, cartJson, CART_TTL_DAYS, TimeUnit.DAYS);
        } catch (JsonProcessingException e) {
            throw new CustomBusinessException("OTK-500", "Gagal menyimpan keranjang guest", 500);
        }
    }

    public void addGuestCartItem(String guestId, CartRequestDTO request) {
        List<CartItemDTO> cart = getGuestCart(guestId);
        
        Optional<CartItemDTO> existing = cart.stream()
            .filter(item -> 
                (request.getProductId() != null && request.getProductId().equals(item.getProductId())) ||
                (request.getCustomOrderId() != null && request.getCustomOrderId().equals(item.getCustomOrderId())))
            .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(existing.get().getQuantity() + request.getQuantity());
        } else {
            CartItemDTO newItem = buildVirtualCartItemDTO(request);
            newItem.setId((int) (Math.random() * 1000000)); // Virtual ID
            cart.add(newItem);
        }
        
        saveGuestCart(guestId, cart);
    }

    public void updateGuestCartItemQuantity(String guestId, Integer cartItemId, Integer quantity) {
        if (quantity <= 0) {
            removeGuestCartItem(guestId, cartItemId);
            return;
        }
        List<CartItemDTO> cart = getGuestCart(guestId);
        cart.stream()
            .filter(item -> item.getId().equals(cartItemId))
            .findFirst()
            .ifPresent(item -> item.setQuantity(quantity));
        saveGuestCart(guestId, cart);
    }

    public void removeGuestCartItem(String guestId, Integer cartItemId) {
        List<CartItemDTO> cart = getGuestCart(guestId);
        cart.removeIf(item -> item.getId().equals(cartItemId));
        saveGuestCart(guestId, cart);
    }

    public void clearGuestCart(String guestId) {
        redisTemplate.delete(REDIS_CART_PREFIX + guestId);
    }

    @SuppressWarnings("null")
    private CartItemDTO buildVirtualCartItemDTO(CartRequestDTO request) {
        CartItemDTO dto = new CartItemDTO();
        dto.setQuantity(request.getQuantity());
        dto.setAddedAt(LocalDateTime.now());

        if (request.getProductId() != null) {
            Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new CustomBusinessException("OTK-4044", "Produk tidak ditemukan", 404));
            dto.setProductId(product.getId());
            dto.setName(product.getName());
            dto.setPrice(product.getPrice());
            dto.setImageUrl(product.getImageUrl());
            dto.setDetails(product.getCategory());
        } else if (request.getCustomOrderId() != null) {
            CustomOrder customOrder = customOrderRepository.findById(request.getCustomOrderId())
                .orElseThrow(() -> new CustomBusinessException("OTK-4045", "Custom order tidak ditemukan", 404));
            dto.setCustomOrderId(customOrder.getId());
            dto.setName(customOrder.getServiceType() + " Custom");
            dto.setPrice(customOrder.getPrice() != null ? customOrder.getPrice() : java.math.BigDecimal.ZERO);
            dto.setImageUrl(customOrder.getPreviewImageUrl() != null ? customOrder.getPreviewImageUrl() : customOrder.getImageReferenceUrl());
            dto.setDetails("Custom order configuration");
        } else {
            throw new CustomBusinessException("OTK-4010", "Harus menyediakan ProductID atau CustomOrderID", 400);
        }
        return dto;
    }

    // ─── User Cart (Database) ──────────────────────────────────────────────────

    public List<CartItemDTO> getUserCart(String email) {
        return cartItemRepository.findByUserEmail(email).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @SuppressWarnings("null")
    public void addUserCartItem(String email, CartRequestDTO request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomBusinessException("OTK-4041", "User tidak ditemukan", 404));

        if (request.getProductId() == null && request.getCustomOrderId() == null) {
            throw new CustomBusinessException("OTK-4010", "Harus menyediakan ProductID atau CustomOrderID", 400);
        }

        Optional<CartItem> existing = Optional.empty();
        if (request.getProductId() != null) {
            existing = cartItemRepository.findByUserEmailAndProductId(email, request.getProductId());
        } else if (request.getCustomOrderId() != null) {
            existing = cartItemRepository.findByUserEmailAndCustomOrderId(email, request.getCustomOrderId());
        }

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            item.setUpdatedAt(LocalDateTime.now());
            cartItemRepository.save(item);
        } else {
            CartItem item = new CartItem();
            item.setUser(user);
            item.setQuantity(request.getQuantity());

            if (request.getProductId() != null) {
                Product product = productRepository.findById(request.getProductId())
                        .orElseThrow(() -> new CustomBusinessException("OTK-4044", "Produk tidak ditemukan", 404));
                item.setProduct(product);
                item.setName(product.getName());
                item.setPrice(product.getPrice());
                item.setImageUrl(product.getImageUrl());
                item.setDetails(product.getCategory());
            } else if (request.getCustomOrderId() != null) {
                CustomOrder customOrder = customOrderRepository.findById(request.getCustomOrderId())
                        .orElseThrow(() -> new CustomBusinessException("OTK-4045", "Custom order tidak ditemukan", 404));
                item.setCustomOrder(customOrder);
                item.setName(customOrder.getServiceType() + " Custom");
                item.setPrice(customOrder.getPrice() != null ? customOrder.getPrice() : java.math.BigDecimal.ZERO);
                item.setImageUrl(customOrder.getPreviewImageUrl() != null ? customOrder.getPreviewImageUrl() : customOrder.getImageReferenceUrl());
                item.setDetails("Custom order configuration");
            }
            cartItemRepository.save(item);
        }
    }

    @Transactional
    @SuppressWarnings("null")
    public void updateUserCartItemQuantity(String email, Integer cartItemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new CustomBusinessException("OTK-404", "Item keranjang tidak ditemukan", 404));
        
        if (!item.getUser().getEmail().equals(email)) {
            throw new CustomBusinessException("OTK-403", "Tidak memiliki akses ke item ini", 403);
        }

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            item.setUpdatedAt(LocalDateTime.now());
            cartItemRepository.save(item);
        }
    }

    @Transactional
    @SuppressWarnings("null")
    public void removeUserCartItem(String email, Integer cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new CustomBusinessException("OTK-404", "Item keranjang tidak ditemukan", 404));
        
        if (!item.getUser().getEmail().equals(email)) {
            throw new CustomBusinessException("OTK-403", "Tidak memiliki akses ke item ini", 403);
        }

        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearUserCart(String email) {
        cartItemRepository.deleteByUserEmail(email);
    }

    // ─── Sync / Merge ──────────────────────────────────────────────────────────

    @Transactional
    public void syncGuestCartToUser(String email, CartSyncRequestDTO request) {
        if (request.getItems() == null || request.getItems().isEmpty()) return;

        for (CartRequestDTO dto : request.getItems()) {
            try {
                addUserCartItem(email, dto);
            } catch (Exception e) {
                // Abaikan jika ada produk yang sudah tidak valid/dihapus
            }
        }
    }

    private CartItemDTO toDTO(CartItem item) {
        CartItemDTO dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        dto.setAddedAt(item.getCreatedAt());

        dto.setName(item.getName());
        dto.setPrice(item.getPrice());
        dto.setImageUrl(item.getImageUrl());
        dto.setDetails(item.getDetails());

        if (item.getProduct() != null) {
            dto.setProductId(item.getProduct().getId());
        } else if (item.getCustomOrder() != null) {
            dto.setCustomOrderId(item.getCustomOrder().getId());
        }
        return dto;
    }
}
