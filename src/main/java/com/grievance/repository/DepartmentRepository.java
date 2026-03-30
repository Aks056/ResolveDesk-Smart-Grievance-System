package com.grievance.repository;

import com.grievance.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Department entity.
 * Provides database access methods for department management.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    // Find department by name
    Optional<Department> findByName(String name);

    // Check if department name exists
    boolean existsByName(String name);

    // Find all active departments
    @Query("SELECT d FROM Department d WHERE d.isActive = true ORDER BY d.name ASC")
    List<Department> findAllActiveDepartments();

    // Find all departments
    @Query("SELECT d FROM Department d ORDER BY d.name ASC")
    List<Department> findAllDepartments();
}
