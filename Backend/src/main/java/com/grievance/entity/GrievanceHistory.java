package com.grievance.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.grievance.enums.GrievanceStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    @Column(length = 100, columnDefinition = "VARCHAR(100)")
    private GrievanceStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100, columnDefinition = "VARCHAR(100)")
    private GrievanceStatus newStatus;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "varchar(20) default 'INTERNAL'")
    @Builder.Default
    private com.grievance.enums.HistoryVisibility visibility = com.grievance.enums.HistoryVisibility.INTERNAL;

    public com.grievance.enums.HistoryVisibility getEffectiveVisibility() {
        if (visibility == null || (remarks != null && remarks.toUpperCase(java.util.Locale.ROOT).contains("[INTERNAL]"))) {
            return com.grievance.enums.HistoryVisibility.INTERNAL;
        }
        return visibility;
    }

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
