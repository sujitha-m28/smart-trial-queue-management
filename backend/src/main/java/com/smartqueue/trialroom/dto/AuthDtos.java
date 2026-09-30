package com.smartqueue.trialroom.dto;

import com.smartqueue.trialroom.entity.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class AuthDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;

        @NotBlank(message = "Full name is required")
        private String fullName;

        private String email;
        private String phone;
        private Role role = Role.CUSTOMER;
        private Long storeId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        @Builder.Default
        private String type = "Bearer";
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private Role role;
        private Long storeId;
        private String storeName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private Role role;
        private Long storeId;
        private String storeName;
        private boolean active;
    }
}
