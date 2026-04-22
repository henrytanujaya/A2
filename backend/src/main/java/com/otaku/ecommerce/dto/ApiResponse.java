package com.otaku.ecommerce.dto;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Pattern;

public class ApiResponse<T> {
    private boolean success;
    
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Format internal code tidak valid")
    private String internalCode;
    
    @Pattern(regexp = "^[^<>{}]*$", message = "Format pesan tidak valid")
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ApiResponse(boolean success, String internalCode, String message, T data) {
        this.success = success;
        this.internalCode = internalCode;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public static <T> ApiResponse<T> success(String internalCode, String message, T data) {
        return new ApiResponse<>(true, internalCode, message, data);
    }

    public static <T> ApiResponse<T> error(String internalCode, String message) {
        return new ApiResponse<>(false, internalCode, message, null);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getInternalCode() { return internalCode; }
    public void setInternalCode(String internalCode) { this.internalCode = internalCode; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
