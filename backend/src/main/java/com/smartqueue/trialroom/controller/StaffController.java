package com.smartqueue.trialroom.controller;

import com.smartqueue.trialroom.dto.QueueDtos.QueueSummaryDto;
import com.smartqueue.trialroom.dto.StoreDtos.TrialRoomDto;
import com.smartqueue.trialroom.entity.RoomStatus;
import com.smartqueue.trialroom.entity.User;
import com.smartqueue.trialroom.service.QueueService;
import com.smartqueue.trialroom.service.TrialRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final QueueService queueService;
    private final TrialRoomService trialRoomService;

    @GetMapping("/queue/{storeId}")
    public ResponseEntity<QueueSummaryDto> getStaffQueueSummary(@PathVariable Long storeId) {
        return ResponseEntity.ok(queueService.getStoreQueueSummary(storeId));
    }

    @GetMapping("/rooms/{storeId}")
    public ResponseEntity<List<TrialRoomDto>> getStoreRooms(@PathVariable Long storeId) {
        return ResponseEntity.ok(trialRoomService.getRoomsByStore(storeId));
    }

    @PatchMapping("/rooms/{roomId}/status")
    public ResponseEntity<TrialRoomDto> updateRoomStatus(
            @PathVariable Long roomId,
            @RequestParam RoomStatus status,
            @AuthenticationPrincipal User user
    ) {
        String username = user != null ? user.getUsername() : "STAFF";
        return ResponseEntity.ok(trialRoomService.updateRoomStatus(roomId, status, username));
    }
}
