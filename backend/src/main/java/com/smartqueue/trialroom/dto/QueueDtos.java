package com.smartqueue.trialroom.dto;

import com.smartqueue.trialroom.entity.RoomStatus;
import com.smartqueue.trialroom.entity.TicketStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class QueueDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JoinQueueRequest {
        @NotNull(message = "Store ID is required")
        private Long storeId;

        private Long serviceTypeId;

        @NotBlank(message = "Customer name is required")
        private String customerName;

        private String customerPhone;
        private String customerEmail;

        @Builder.Default
        private Integer garmentCount = 3;

        @Builder.Default
        private boolean vip = false;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QueueTicketDto {
        private Long id;
        private String tokenNumber;
        private Long storeId;
        private String storeName;
        private Long serviceTypeId;
        private String serviceTypeName;
        private Long customerUserId;
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private Integer garmentCount;
        private TicketStatus status;
        private Integer priorityLevel;
        private Integer estimatedWaitMinutes;
        private Integer peopleAhead;
        private Long assignedRoomId;
        private String assignedRoomNumber;
        private Long assignedStaffId;
        private String assignedStaffName;
        private LocalDateTime joinedAt;
        private LocalDateTime calledAt;
        private LocalDateTime serviceStartedAt;
        private LocalDateTime completedAt;
        private Integer actualServiceDurationMinutes;
        private String notes;
        private String currentlyServingToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CallTicketRequest {
        private Long storeId;
        private Long roomId;
        private String roomNumber;
        private Long ticketId; // null to auto-call next in queue
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateTicketStatusRequest {
        private TicketStatus status;
        private Long roomId;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QueueSummaryDto {
        private Long storeId;
        private String storeName;
        private String nowServingToken;
        private String nextToken;
        private int waitingCount;
        private int servingCount;
        private int completedToday;
        private int estimatedWaitMinutes;
        private List<QueueTicketDto> waitingList;
        private List<QueueTicketDto> activeList;
        private List<RoomCardDto> rooms;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomCardDto {
        private Long roomId;
        private String roomNumber;
        private String roomType;
        private RoomStatus status;
        private Long currentTicketId;
        private String currentTokenNumber;
        private String customerName;
        private Integer garmentCount;
        private LocalDateTime serviceStartedAt;
        private Integer elapsedMinutes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublicDisplayDto {
        private String storeName;
        private String storeCode;
        private List<RoomCardDto> activeRooms;
        private List<String> nowServingTokens;
        private List<QueueTicketDto> upNextTokens;
        private int totalWaiting;
        private int averageWaitMinutes;
        private LocalDateTime lastUpdated;
    }
}
