package com.grievance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity storing user feedback and ratings for resolved grievances.
 * Users can provide feedback after a grievance is resolved.
 */
@Entity
@Table(name = "feedback", indexes = {
    @Index(name = "idx_grievance_id", columnList = "grievance_id"),
    @Index(name = "idx_user_id", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grievance_id", nullable = false)
    private Grievance grievance;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer rating;  // 1 to 5 stars

    @Column(columnDefinition = "TEXT")
    private String comments;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    private void validateRating() {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
    }

    public String getRatingDisplay() {
        return "★".repeat(rating) + "☆".repeat(5 - rating);
    }
}
