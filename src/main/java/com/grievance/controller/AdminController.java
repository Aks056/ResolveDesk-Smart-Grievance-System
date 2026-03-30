package com.grievance.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.entity.Department;
import com.grievance.service.DepartmentService;
import com.grievance.service.GrievanceService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@AllArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
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
            @PathVariable Long officerId) {
        log.info("Assigning grievance {} to officer {}", grievanceId, officerId);

        var response = grievanceService.assignGrievanceToOfficer(grievanceId, officerId, 1L);
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
}
