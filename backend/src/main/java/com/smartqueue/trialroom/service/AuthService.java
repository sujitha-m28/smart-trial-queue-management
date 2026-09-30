package com.smartqueue.trialroom.service;

import com.smartqueue.trialroom.config.JwtService;
import com.smartqueue.trialroom.dto.AuthDtos.*;
import com.smartqueue.trialroom.entity.Role;
import com.smartqueue.trialroom.entity.Store;
import com.smartqueue.trialroom.entity.User;
import com.smartqueue.trialroom.repository.StoreRepository;
import com.smartqueue.trialroom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditLogService auditLogService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        String token = jwtService.generateToken(user);

        String storeName = null;
        if (user.getStoreId() != null) {
            storeName = storeRepository.findById(user.getStoreId()).map(Store::getName).orElse(null);
        }

        auditLogService.log(user.getUsername(), user.getRole().name(), "LOGIN", "User", user.getId().toString(), "User logged in", user.getStoreId());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .storeId(user.getStoreId())
                .storeName(storeName)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank() && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : Role.CUSTOMER)
                .storeId(request.getStoreId())
                .active(true)
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(user);
        auditLogService.log(user.getUsername(), user.getRole().name(), "REGISTER", "User", user.getId().toString(), "New user registration", user.getStoreId());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .storeId(user.getStoreId())
                .build();
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToUserDto).collect(Collectors.toList());
    }

    public List<UserDto> getStaffUsers() {
        return userRepository.findByRole(Role.STAFF).stream().map(this::mapToUserDto).collect(Collectors.toList());
    }

    @Transactional
    public UserDto createStaffUser(RegisterRequest request, String adminUsername) {
        request.setRole(Role.STAFF);
        AuthResponse res = register(request);
        auditLogService.log(adminUsername, "ADMIN", "CREATE_STAFF", "User", res.getId().toString(), "Created staff account " + request.getUsername(), request.getStoreId());
        User user = userRepository.findById(res.getId()).orElseThrow();
        return mapToUserDto(user);
    }

    @Transactional
    public void deleteUser(Long userId, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log(adminUsername, "ADMIN", "DEACTIVATE_USER", "User", userId.toString(), "Deactivated user " + user.getUsername(), user.getStoreId());
    }

    private UserDto mapToUserDto(User u) {
        String storeName = null;
        if (u.getStoreId() != null) {
            storeName = storeRepository.findById(u.getStoreId()).map(Store::getName).orElse(null);
        }
        return UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole())
                .storeId(u.getStoreId())
                .storeName(storeName)
                .active(u.isActive())
                .build();
    }
}
