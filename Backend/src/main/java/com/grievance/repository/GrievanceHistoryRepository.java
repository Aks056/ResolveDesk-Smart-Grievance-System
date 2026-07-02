package com.grievance.repository;

import com.grievance.entity.Grievance;
import com.grievance.entity.GrievanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for GrievanceHistory entity.
 * Provides database access methods for grievance audit trail.
 */
@Repository
public interface GrievanceHistoryRepository extends JpaRepository<GrievanceHistory, Long> {

    // Find all history entries for a grievance
    @Query("SELECT gh FROM GrievanceHistory gh WHERE gh.grievance = :grievance ORDER BY gh.updatedAt DESC")
    List<GrievanceHistory> findByGrievanceOrderByUpdatedAtDesc(@Param("grievance") Grievance grievance);

    // Count history entries for a grievance
    long countByGrievance(Grievance grievance);

    // Find latest status change for a grievance
    @Query("SELECT gh FROM GrievanceHistory gh WHERE gh.grievance = :grievance ORDER BY gh.updatedAt DESC LIMIT 1")
    GrievanceHistory findLatestHistoryByGrievance(@Param("grievance") Grievance grievance);
}
