package com.otaku.ecommerce.repository;

import com.otaku.ecommerce.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByUserEmail(String email);

    List<Order> findByStatusAndCreatedAtBefore(String status, LocalDateTime cutoff);

    java.util.Optional<Order> findByTrackingNumber(String trackingNumber);
}
