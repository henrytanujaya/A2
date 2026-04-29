package com.otaku.ecommerce.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "PaymentProofs")
public class PaymentProof {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProofID")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OrderID", nullable = false)
    private Order order;

    @Column(name = "ProofType") // e.g., 'XENDIT_PAYMENT', 'SHIPPING_RECEIPT', 'DELIVERY_CONFIRMATION'
    private String proofType;

    @Column(name = "ProofURL", length = 500)
    private String proofUrl;

    @Column(name = "ExternalReference") // e.g., Xendit ID or Tracking Number
    private String externalReference;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "Description")
    private String description;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public String getProofType() { return proofType; }
    public void setProofType(String proofType) { this.proofType = proofType; }
    public String getProofUrl() { return proofUrl; }
    public void setProofUrl(String proofUrl) { this.proofUrl = proofUrl; }
    public String getExternalReference() { return externalReference; }
    public void setExternalReference(String externalReference) { this.externalReference = externalReference; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
