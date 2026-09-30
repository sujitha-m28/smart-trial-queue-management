package com.smartqueue.trialroom.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class AiAssistantDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatRequest {
        private String message;
        private Long storeId;
        private String tokenNumber;
        private String customerName;
        private Integer garmentCount;
        private String conversationContext;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponse {
        private String reply;
        private String intent; // "WAIT_TIME_QUERY", "STORE_POLICY", "GARMENT_LIMIT", "ASSISTANCE_REQUEST", "GENERAL"
        private List<String> quickActions;
        private Integer estimatedRemainingMinutes;
        private LocalDateTime timestamp;
    }
}
