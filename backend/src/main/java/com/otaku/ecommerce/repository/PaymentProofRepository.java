package com.otaku.ecommerce.repository;

import com.otaku.ecommerce.entity.PaymentProof;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentProofRepository extends JpaRepository<PaymentProof, Integer> {
    List<PaymentProof> findByOrderId(Integer orderId);
    List<PaymentProof> findByOrderIdAndProofType(Integer orderId, String proofType);
}
