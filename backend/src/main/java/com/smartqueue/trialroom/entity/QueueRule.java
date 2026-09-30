package com.smartqueue.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "queue_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long storeId;

    @Builder.Default
    private Integer maxGarmentsPerPerson = 6;

    @Builder.Default
    private Integer bufferTimeMinutes = 2;

    @Builder.Default
    private Integer autoNoShowMinutes = 5;

    @Builder.Default
    private Double vipPriorityMultiplier = 1.5;

    @Builder.Default
    private boolean enableAiOptimization = true;

    @Builder.Default
    private boolean sendSmsNotifications = true;
}
