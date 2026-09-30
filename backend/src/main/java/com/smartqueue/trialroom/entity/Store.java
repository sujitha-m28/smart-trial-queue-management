package com.smartqueue.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code; // e.g. "STR-NYC-01" or "DOWNTOWN-FLAGSHIP"

    @Column(nullable = false)
    private String name;

    private String location;

    private String address;

    private String contactPhone;

    private String openingHours; // e.g. "09:00 - 22:00"

    @Builder.Default
    private Integer totalRooms = 6;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
