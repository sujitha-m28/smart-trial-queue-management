package com.smartqueue.trialroom.controller;

import com.smartqueue.trialroom.dto.AnalyticsDtos.DashboardStatsDto;
import com.smartqueue.trialroom.dto.AuthDtos.RegisterRequest;
import com.smartqueue.trialroom.dto.AuthDtos.UserDto;
import com.smartqueue.trialroom.dto.FeedbackDtos.FeedbackDto;
import com.smartqueue.trialroom.dto.StoreDtos.*;
import com.smartqueue.trialroom.entity.AuditLog;
import com.smartqueue.trialroom.entity.User;
import com.smartqueue.trialroom.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AnalyticsService analyticsService;
    private final StoreService storeService;
    private final TrialRoomService trialRoomService;
    private final AuthService authService;
    private final FeedbackService feedbackService;
    private final AuditLogService auditLogService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats(@RequestParam(required = false) Long storeId) {
        return ResponseEntity.ok(analyticsService.getDashboardStats(storeId));
    }

    // Stores
    @PostMapping("/stores")
    public ResponseEntity<StoreDto> createStore(
            @Valid @RequestBody StoreDto dto,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "ADMIN";
        return ResponseEntity.ok(storeService.createStore(dto, username));
    }

    @PutMapping("/stores/{id}")
    public ResponseEntity<StoreDto> updateStore(
            @PathVariable Long id,
            @Valid @RequestBody StoreDto dto,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "ADMIN";
        return ResponseEntity.ok(storeService.updateStore(id, dto, username));
    }

    @DeleteMapping("/stores/{id}")
    public ResponseEntity<Void> deleteStore(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "ADMIN";
        storeService.deleteStore(id, username);
        return ResponseEntity.noContent().build();
    }

    // Trial Rooms
    @PostMapping("/rooms")
    public ResponseEntity<TrialRoomDto> createRoom(
            @RequestBody TrialRoomDto dto,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "ADMIN";
        return ResponseEntity.ok(trialRoomService.createRoom(dto, username));
    }

    // Users & Staff
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/staff")
    public ResponseEntity<List<UserDto>> getStaffUsers() {
        return ResponseEntity.ok(authService.getStaffUsers());
    }

    @PostMapping("/staff")
    public ResponseEntity<UserDto> createStaff(
            @Valid @RequestBody RegisterRequest request,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "ADMIN";
        return ResponseEntity.ok(authService.createStaffUser(request, username));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "ADMIN";
        authService.deleteUser(id, username);
        return ResponseEntity.noContent().build();
    }

    // Queue Rules
    @GetMapping("/rules/{storeId}")
    public ResponseEntity<QueueRuleDto> getQueueRule(@PathVariable Long storeId) {
        return ResponseEntity.ok(storeService.getQueueRule(storeId));
    }

    @PutMapping("/rules/{storeId}")
    public ResponseEntity<QueueRuleDto> updateQueueRule(
            @PathVariable Long storeId,
            @RequestBody QueueRuleDto dto,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "ADMIN";
        return ResponseEntity.ok(storeService.updateQueueRule(storeId, dto, username));
    }

    // Feedbacks & CSAT
    @GetMapping("/feedbacks")
    public ResponseEntity<List<FeedbackDto>> getAllFeedbacks() {
        return ResponseEntity.ok(feedbackService.getAllFeedbacks());
    }

    // Audit Logs
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@RequestParam(required = false) Long storeId) {
        if (storeId != null) {
            return ResponseEntity.ok(auditLogService.getLogsByStore(storeId));
        }
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }
}
