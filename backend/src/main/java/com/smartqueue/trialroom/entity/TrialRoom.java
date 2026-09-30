package com.smartqueue.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trial_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrialRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long storeId;

    @Column(nullable = false)
    private String roomNumber; // e.g. "Room 01", "VIP-A"

    private String roomType; // "REGULAR", "EXPRESS", "VIP", "ACCESSIBLE"

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RoomStatus status = RoomStatus.AVAILABLE;

    private Long currentTicketId;

    private String currentTokenNumber;

    @Builder.Default
    private boolean active = true;
}
