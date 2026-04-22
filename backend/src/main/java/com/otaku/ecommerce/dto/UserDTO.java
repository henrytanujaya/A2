package com.otaku.ecommerce.dto;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Pattern;

public class UserDTO {
    private Integer id;
    
    @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Format nama tidak valid")
    private String name;
    
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Format email tidak valid")
    private String email;
    
    @Pattern(regexp = "^(USER|ADMIN)$", message = "Role tidak valid")
    private String role;
    private LocalDateTime createdAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
