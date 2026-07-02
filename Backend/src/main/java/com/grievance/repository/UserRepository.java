package com.grievance.repository;

import com.grievance.entity.User;
import com.grievance.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for User entity.
 * Provides database access methods for user management.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by username
    Optional<User> findByUsername(String username);

    // Find user by email
    Optional<User> findByEmail(String email);

    // Check if username exists
    boolean existsByUsername(String username);

    // Check if email exists
    boolean existsByEmail(String email);

    // Find all users by role
    List<User> findByRole(Role role);

    // Find all officers in a specific department
    @Query("SELECT u FROM User u WHERE u.role = 'OFFICER' AND u.department.id = :departmentId AND u.isActive = true")
    List<User> findActiveOfficersByDepartment(@Param("departmentId") Long departmentId);

    // Find all active users
    @Query("SELECT u FROM User u WHERE u.isActive = true ORDER BY u.createdAt DESC")
    List<User> findAllActiveUsers();

    // Find active admin users
    @Query("SELECT u FROM User u WHERE u.role = 'ADMIN' AND u.isActive = true")
    List<User> findActiveAdmins();

    // Find user by username (case-insensitive)
    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username)")
    Optional<User> findByUsernameIgnoreCase(@Param("username") String username);
}
