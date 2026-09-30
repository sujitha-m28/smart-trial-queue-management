package com.smartqueue.trialroom.dto;

import com.smartqueue.trialroom.entity.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class StoreDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StoreDto {
        private Long id;
        @NotBlank(message = "Store code is required")
        private String code;
        @NotBlank(message = "Store name is required")
        private String name;
        private String location;
        private String address;
        private String contactPhone;
        private String openingHours;
        private Integer totalRooms;
        private boolean active;
        private int currentWaiting;
        private int currentServing;
        private Double avgRating;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrialRoomDto {
        private Long id;
        private Long storeId;
        private String roomNumber;
        private String roomType;
        private RoomStatus status;
        private Long currentTicketId;
        private String currentTokenNumber;
        private boolean active;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ServiceTypeDto {
        private Long id;
        private String code;
        private String name;
        private String description;
        private Integer maxItems;
        private Integer avgServiceMinutes;
        private Integer priorityLevel;
        private boolean active;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QueueRuleDto {
        private Long id;
        private Long storeId;
        private Integer maxGarmentsPerPerson;
        private Integer bufferTimeMinutes;
        private Integer autoNoShowMinutes;
        private Double vipPriorityMultiplier;
        private boolean enableAiOptimization;
        private boolean sendSmsNotifications;
    }
}
