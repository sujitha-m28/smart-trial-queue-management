package com.smartqueue.trialroom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actorUsername;

    private String actorRole;

    @Column(nullable = false)
    private String action; // "JOIN_QUEUE", "CALL_NEXT", "START_SERVICE", "COMPLETE_SERVICE", "SKIP", "NO_SHOW", "CANCEL"

    private String entityName;

    private String entityId;

    @Column(length = 1000)
    private String details;

    private Long storeId;

    @CreationTimestamp
    private LocalDateTime timestamp;
}
