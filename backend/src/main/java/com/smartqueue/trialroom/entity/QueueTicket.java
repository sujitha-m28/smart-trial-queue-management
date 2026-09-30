package com.smartqueue.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "queue_tickets", indexes = {
    @Index(name = "idx_store_status", columnList = "storeId, status"),
    @Index(name = "idx_token_number", columnList = "tokenNumber")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String tokenNumber; // e.g. "TR-042"

    @Column(nullable = false)
    private Long storeId;

    private Long serviceTypeId;

    private String serviceTypeName;

    private Long customerUserId; // Optional linked user account

    @Column(nullable = false)
    private String customerName;

    private String customerPhone;

    private String customerEmail;

    @Builder.Default
    private Integer garmentCount = 3;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.WAITING;

    @Builder.Default
    private Integer priorityLevel = 1; // higher gets served sooner

    private Integer estimatedWaitMinutes;

    private Integer peopleAhead;

    private Long assignedRoomId;

    private String assignedRoomNumber;

    private Long assignedStaffId;

    private String assignedStaffName;

    @CreationTimestamp
    private LocalDateTime joinedAt;

    private LocalDateTime calledAt;

    private LocalDateTime serviceStartedAt;

    private LocalDateTime completedAt;

    private Integer actualServiceDurationMinutes;

    private String notes;
}
