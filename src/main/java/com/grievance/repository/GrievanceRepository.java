package com.grievance.repository;

import com.grievance.entity.Grievance;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Grievance entity.
 * Provides database access methods for grievance management.
 */
@Repository
public interface GrievanceRepository extends JpaRepository<Grievance, Long> {

    // Find by grievance number
    Optional<Grievance> findByGrievanceNumber(String grievanceNumber);

    // Find all grievances by citizen
    List<Grievance> findByCitizen(User citizen);

    // Find all grievances assigned to an officer
    List<Grievance> findByAssignedOfficer(User officer);

    // Find all grievances by status
    List<Grievance> findByStatus(GrievanceStatus status);

    // Find all grievances by department
    List<Grievance> findByDepartment_IdOrderByCreatedAtDesc(Long departmentId);

    // Find pending grievances (not assigned)
    @Query("SELECT g FROM Grievance g WHERE g.status = 'PENDING' AND g.assignedOfficer IS NULL ORDER BY g.priority DESC, g.createdAt ASC")
    List<Grievance> findPendingGrievances();

    // Count grievances by status
    long countByStatus(GrievanceStatus status);

    // Count grievances by citizen
    long countByCitizen(User citizen);

    // Find grievances by status and priority
    @Query("SELECT g FROM Grievance g WHERE g.status = :status AND g.priority = :priority ORDER BY g.createdAt DESC")
    List<Grievance> findByStatusAndPriority(@Param("status") GrievanceStatus status, @Param("priority") Priority priority);

    // Find grievances created within a date range
    @Query("SELECT g FROM Grievance g WHERE g.createdAt >= :startDate AND g.createdAt <= :endDate ORDER BY g.createdAt DESC")
    List<Grievance> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Find resolved grievances for a citizen
    @Query("SELECT g FROM Grievance g WHERE g.citizen = :citizen AND (g.status = 'RESOLVED' OR g.status = 'REJECTED') ORDER BY g.updatedAt DESC")
    List<Grievance> findResolvedGrievancesByCitizen(@Param("citizen") User citizen);

    // Count grievances by department
    long countByDepartment_Id(Long departmentId);

    // Find average resolution time by department
    @Query(value = "SELECT AVG(DATEDIFF(CURDATE(), g.created_at)) FROM grievances g WHERE g.department_id = :departmentId AND g.status IN ('RESOLVED', 'REJECTED')", nativeQuery = true)
    Double getAverageResolutionTimeByDepartment(@Param("departmentId") Long departmentId);

    // Find top 3 recent grievances for a citizen with a specific status
    List<Grievance> findTop3ByCitizenAndStatusOrderByCreatedAtDesc(User citizen, GrievanceStatus status);
}
