package com.grievance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.grievance.enums.GrievanceStatus;
import java.time.LocalDateTime;

/**
 * Entity maintaining audit trail for all grievance status changes.
 * Tracks what status changed from/to, who made the change, and when.
 */
@Entity
@Table(name = "grievance_history", indexes = {
    @Index(name = "idx_grievance_id", columnList = "grievance_id"),
    @Index(name = "idx_updated_by_user_id", columnList = "updated_by_user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grievance_id", nullable = false)
    private Grievance grievance;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private GrievanceStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private GrievanceStatus newStatus;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "updated_by_user_id", nullable = false)
    private User updatedByUser;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime updatedAt;

    public String getStatusTransition() {
        String oldStatusStr = oldStatus != null ? oldStatus.toString() : "N/A";
        return oldStatusStr + " → " + newStatus.toString();
    }
}
