package com.otaku.ecommerce.repository;

import com.otaku.ecommerce.entity.OrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderTrackingRepository extends JpaRepository<OrderTracking, Integer> {
    List<OrderTracking> findByOrderIdOrderByCreatedAtDesc(Integer orderId);
}
