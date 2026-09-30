package com.smartqueue.trialroom.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

public class FeedbackDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeedbackRequest {
        @NotNull(message = "Ticket ID is required")
        private Long queueTicketId;

        @Builder.Default
        @Min(1) @Max(5)
        private Integer rating = 5;

        @Builder.Default
        @Min(1) @Max(5)
        private Integer waitTimeSatisfaction = 5;

        @Builder.Default
        @Min(1) @Max(5)
        private Integer staffHelpfulness = 5;

        @Builder.Default
        @Min(1) @Max(5)
        private Integer roomCleanliness = 5;

        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FeedbackDto {
        private Long id;
        private Long queueTicketId;
        private String tokenNumber;
        private Long storeId;
        private Integer rating;
        private Integer waitTimeSatisfaction;
        private Integer staffHelpfulness;
        private Integer roomCleanliness;
        private String comment;
        private String customerName;
        private LocalDateTime submittedAt;
    }
}
