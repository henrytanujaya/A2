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

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE " +
        "(:tab = 'all' OR " +
        " (:tab = 'perlu_resi' AND o.status = 'Processing' AND (o.trackingNumber IS NULL OR o.trackingNumber = '')) OR " +
        " (:tab = 'Cancelled' AND LOWER(o.status) IN ('cancelled', 'rejected', 'expired', 'timed_out')) OR " +
        " (:tab != 'all' AND :tab != 'perlu_resi' AND :tab != 'Cancelled' AND LOWER(o.status) = LOWER(:tab)) ) " +
        "AND " +
        "(:term IS NULL OR :term = '' OR " +
        " (:type = 'id' AND CAST(o.id AS string) LIKE CONCAT('%', :term, '%')) OR " +
        " (:type = 'tracking' AND LOWER(o.trackingNumber) LIKE LOWER(CONCAT('%', :term, '%'))) OR " +
        " (:type = 'status' AND LOWER(o.status) LIKE LOWER(CONCAT('%', :term, '%'))) " +
        ")")
    org.springframework.data.domain.Page<Order> findFilteredOrders(
        @org.springframework.data.repository.query.Param("tab") String tab,
        @org.springframework.data.repository.query.Param("type") String type,
        @org.springframework.data.repository.query.Param("term") String term,
        org.springframework.data.domain.Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE " +
        "MONTH(o.createdAt) = :month AND " +
        "YEAR(o.createdAt) = :year AND " +
        "o.status IN ('Paid', 'Processing', 'Shipped', 'Completed')")
    List<Order> findAuditOrders(
        @org.springframework.data.repository.query.Param("month") int month,
        @org.springframework.data.repository.query.Param("year") int year
    );

    @org.springframework.data.jpa.repository.Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status IN ('Paid', 'Processing', 'Shipped', 'Completed')")
    java.math.BigDecimal sumRevenue();

    List<Order> findTop5ByOrderByCreatedAtDesc();
}
