package com.smartqueue.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code; // "REGULAR", "EXPRESS", "VIP", "ACCESSIBLE"

    @Column(nullable = false)
    private String name; // "Standard Trial Room", "Express 2-Garment Fitting", "VIP Styling Suite"

    private String description;

    @Builder.Default
    private Integer maxItems = 6;

    @Builder.Default
    private Integer avgServiceMinutes = 8;

    @Builder.Default
    private Integer priorityLevel = 1; // 1 = standard, 2 = express, 3 = VIP / priority

    @Builder.Default
    private boolean active = true;
}
