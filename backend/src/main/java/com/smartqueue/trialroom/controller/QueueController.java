package com.smartqueue.trialroom.controller;

import com.smartqueue.trialroom.dto.QueueDtos.*;
import com.smartqueue.trialroom.entity.User;
import com.smartqueue.trialroom.service.QueueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    @PostMapping("/join")
    public ResponseEntity<QueueTicketDto> joinQueue(
            @Valid @RequestBody JoinQueueRequest request,
            @AuthenticationPrincipal User user
    ) {
        Long userId = user != null ? user.getId() : null;
        String username = user != null ? user.getUsername() : request.getCustomerName();
        return ResponseEntity.ok(queueService.joinQueue(request, userId, username));
    }

    @GetMapping("/status/{tokenNumber}")
    public ResponseEntity<QueueTicketDto> getTicketStatus(@PathVariable String tokenNumber) {
        return ResponseEntity.ok(queueService.getTicketStatus(tokenNumber));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<QueueTicketDto> getTicketById(@PathVariable Long ticketId) {
        return ResponseEntity.ok(queueService.getTicketById(ticketId));
    }

    @PostMapping("/cancel/{ticketId}")
    public ResponseEntity<QueueTicketDto> cancelTicket(
            @PathVariable Long ticketId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "CUSTOMER";
        return ResponseEntity.ok(queueService.cancelTicket(ticketId, reason, username));
    }

    @GetMapping("/store/{storeId}/summary")
    public ResponseEntity<QueueSummaryDto> getStoreQueueSummary(@PathVariable Long storeId) {
        return ResponseEntity.ok(queueService.getStoreQueueSummary(storeId));
    }

    // Staff actions
    @PostMapping("/call")
    public ResponseEntity<QueueTicketDto> callTicket(
            @RequestBody CallTicketRequest request,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "STAFF";
        return ResponseEntity.ok(queueService.callNextTicket(request, username));
    }

    @PostMapping("/start-service/{ticketId}")
    public ResponseEntity<QueueTicketDto> startService(
            @PathVariable Long ticketId,
            @RequestParam(required = false) Long roomId,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "STAFF";
        return ResponseEntity.ok(queueService.startService(ticketId, roomId, username));
    }

    @PostMapping("/complete/{ticketId}")
    public ResponseEntity<QueueTicketDto> completeService(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "STAFF";
        return ResponseEntity.ok(queueService.completeService(ticketId, username));
    }

    @PostMapping("/skip/{ticketId}")
    public ResponseEntity<QueueTicketDto> skipTicket(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "STAFF";
        return ResponseEntity.ok(queueService.skipTicket(ticketId, username));
    }

    @PostMapping("/recall/{ticketId}")
    public ResponseEntity<QueueTicketDto> recallTicket(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "STAFF";
        return ResponseEntity.ok(queueService.recallTicket(ticketId, username));
    }

    @PostMapping("/no-show/{ticketId}")
    public ResponseEntity<QueueTicketDto> markNoShow(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "STAFF";
        return ResponseEntity.ok(queueService.markNoShow(ticketId, username));
    }
}
