package com.smartqueue.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long queueTicketId;

    private String tokenNumber;

    private Long storeId;

    @Column(nullable = false)
    private Integer rating; // 1 to 5 stars

    private Integer waitTimeSatisfaction; // 1 to 5

    private Integer staffHelpfulness; // 1 to 5

    private Integer roomCleanliness; // 1 to 5

    @Column(length = 1000)
    private String comment;

    private String customerName;

    @CreationTimestamp
    private LocalDateTime submittedAt;
}
