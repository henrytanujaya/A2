package com.otaku.ecommerce.dto;

import java.time.LocalDateTime;

public class PaymentProofDTO {
    private Integer id;
    private String proofType;
    private String proofUrl;
    private String externalReference;
    private LocalDateTime createdAt;
    private String description;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
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
