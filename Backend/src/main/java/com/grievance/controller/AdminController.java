package com.grievance.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.entity.Department;
import com.grievance.security.CustomUserDetails;
import com.grievance.service.DepartmentService;
import com.grievance.service.GrievanceService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@AllArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private DepartmentService departmentService;
    private GrievanceService grievanceService;
    private com.grievance.service.UserService userService;

    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(@RequestBody Map<String, String> request) {
        log.info("Creating new department: {}", request.get("name"));

        Department department = departmentService.createDepartment(
                request.get("name"),
                request.get("description"),
                request.get("contactEmail")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(department);
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getAllDepartments() {
        log.debug("Fetching all departments");
        List<Department> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<?> getDepartmentById(@PathVariable Long id) {
        log.debug("Fetching department: {}", id);
        Department department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(department);
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<?> updateDepartment(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        log.info("Updating department: {}", id);

        Department department = departmentService.updateDepartment(
                id,
                request.get("name"),
                request.get("description"),
                request.get("contactEmail")
        );
        return ResponseEntity.ok(department);
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        log.info("Deleting department: {}", id);
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/grievances/{grievanceId}/assign/{officerId}")
    public ResponseEntity<?> assignGrievanceToOfficer(
            @PathVariable Long grievanceId,
            @PathVariable Long officerId,
            Authentication authentication) {
        log.info("Assigning grievance {} to officer {}", grievanceId, officerId);
        Long adminId = getUserId(authentication);
        var response = grievanceService.assignGrievanceToOfficer(grievanceId, officerId, adminId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getAdminStatistics() {
        log.debug("Fetching admin statistics");
        return ResponseEntity.ok(Map.of(
                "totalGrievances", grievanceService.getAllGrievances().size(),
                "totalDepartments", departmentService.getAllDepartments().size(),
                "totalUsers", userService.countUsers()
        ));
    }

    @GetMapping("/grievances")
    public ResponseEntity<?> getAllGrievances() {
        log.info("Fetching all grievances for admin");
        return ResponseEntity.ok(grievanceService.getAllGrievances());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("Fetching all users for admin - page: {}, size: {}", page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(userService.getAllUsers(pageable));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id) {
        log.info("Fetching details for user: {}", id);
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<?> toggleUserActive(@PathVariable Long id, @RequestParam Boolean isActive) {
        log.info("Toggling user {} active status to {}", id, isActive);
        return ResponseEntity.ok(userService.toggleUserActive(id, isActive));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        log.info("Deleting user: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("User not authenticated properly");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUserId();
    }
}
