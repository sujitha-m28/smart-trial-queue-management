package com.smartqueue.trialroom.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AnalyticsDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardStatsDto {
        private long totalUsers;
        private long totalStaff;
        private long activeQueues;
        private long todayCustomers;
        private long todayCompleted;
        private long todayNoShows;
        private long todayCancelled;
        private double averageWaitMinutes;
        private double averageServiceMinutes;
        private double customerSatisfactionScore; // e.g. 4.8 / 5.0
        private List<HourlyTrendDto> hourlyTraffic;
        private List<RoomUtilizationDto> roomUtilization;
        private List<StaffPerformanceDto> staffPerformance;
        private AiInsightsDto aiInsights;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlyTrendDto {
        private String hour; // "09:00", "10:00", etc.
        private int arrivals;
        private int completed;
        private int averageWaitMinutes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomUtilizationDto {
        private String roomNumber;
        private String roomType;
        private int customersServed;
        private int activeMinutes;
        private double utilizationPercentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StaffPerformanceDto {
        private Long staffId;
        private String staffName;
        private int customersServed;
        private double avgFittingDurationMinutes;
        private double rating;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AiInsightsDto {
        private String predictedPeakHour;
        private int recommendedStaffCount;
        private String bottleneckRoom;
        private String recommendationSummary;
        private List<String> actionableTips;
    }
}
