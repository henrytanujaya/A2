package com.otaku.ecommerce.repository;

import com.otaku.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    List<CartItem> findByUserEmail(String email);
    Optional<CartItem> findByUserEmailAndProductId(String email, Integer productId);
    Optional<CartItem> findByUserEmailAndCustomOrderId(String email, Integer customOrderId);
    void deleteByUserEmail(String email);
}
