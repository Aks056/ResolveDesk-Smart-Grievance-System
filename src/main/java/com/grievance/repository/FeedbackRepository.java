package com.grievance.repository;

import com.grievance.entity.Feedback;
import com.grievance.entity.Grievance;
import com.grievance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Feedback entity.
 * Provides database access methods for feedback management.
 */
@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // Find feedback for a grievance
    @Query("SELECT f FROM Feedback f WHERE f.grievance = :grievance ORDER BY f.createdAt DESC")
    List<Feedback> findByGrievanceOrderByCreatedAtDesc(@Param("grievance") Grievance grievance);

    // Find feedback by user
    @Query("SELECT f FROM Feedback f WHERE f.user = :user ORDER BY f.createdAt DESC")
    List<Feedback> findByUserOrderByCreatedAtDesc(@Param("user") User user);

    // Check if feedback exists for a grievance
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Feedback f WHERE f.grievance = :grievance")
    boolean existsForGrievance(@Param("grievance") Grievance grievance);

    // Find feedback by grievance and user
    Optional<Feedback> findByGrievanceAndUser(Grievance grievance, User user);

    // Calculate average rating for a grievance
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.grievance = :grievance")
    Double getAverageRatingForGrievance(@Param("grievance") Grievance grievance);

    // Calculate average rating for all grievances in a department
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.grievance.department.id = :departmentId")
    Double getAverageRatingByDepartment(@Param("departmentId") Long departmentId);

    // Count feedback by rating value
    long countByRating(Integer rating);
}
