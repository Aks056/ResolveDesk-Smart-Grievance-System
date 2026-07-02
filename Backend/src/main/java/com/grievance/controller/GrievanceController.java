package com.grievance.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.grievance.dto.request.UpdateStatusRequest;
import com.grievance.dto.response.GrievanceResponse;
import com.grievance.enums.Priority;
import com.grievance.security.CustomUserDetails;
import com.grievance.service.GrievanceService;
import com.grievance.service.DepartmentService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/grievances")
@AllArgsConstructor
@Slf4j
public class GrievanceController {

    private GrievanceService grievanceService;
    private DepartmentService departmentService;

    // ================= DEPARTMENTS =================
    @GetMapping("/departments")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    // ================= SUBMIT =================
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> submitGrievance(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam Long departmentId,
            @RequestParam String priority,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        try {
            Long userId = getUserId(authentication);
            Priority priorityEnum = Priority.valueOf(priority.toUpperCase());

            GrievanceResponse grievance = grievanceService.submitGrievance(
                    userId, title, description, departmentId, priorityEnum, file);

            return ResponseEntity.status(HttpStatus.CREATED).body(grievance);

        } catch (Exception e) {
            log.error("Error submitting grievance", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error submitting grievance");
        }
    }

    // ================= MY =================
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyGrievances(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.getUserGrievances(userId));
    }

    // ================= RECENT =================
    @GetMapping("/recent")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getRecentGrievances(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.getRecentGrievances(userId));
    }

    // ================= DETAILS =================
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getGrievanceDetails(@PathVariable Long id, Authentication authentication) {
        Long requesterId = getUserId(authentication);
        boolean isAdminOrOfficer = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_OFFICER"));
        return ResponseEntity.ok(grievanceService.getGrievanceDetails(id, requesterId, isAdminOrOfficer));
    }

    // ================= ASSIGNED =================
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('OFFICER','ADMIN')")
    public ResponseEntity<?> getAssignedGrievances(Authentication authentication) {
        Long officerId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.getAssignedGrievances(officerId));
    }

    // ================= STATUS UPDATE =================
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OFFICER','ADMIN')")
    public ResponseEntity<?> updateGrievanceStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication) {

        Long officerId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.updateStatus(id, officerId, request));
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteGrievance(@PathVariable Long id) {
        grievanceService.deleteGrievance(id);
        return ResponseEntity.noContent().build();
    }

    // ================= ALL (Global Feed) =================
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getGlobalGrievances(Authentication authentication) {
        boolean isAdminOrOfficer = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_OFFICER"));
        return ResponseEntity.ok(grievanceService.getGlobalGrievances(!isAdminOrOfficer));
    }

    // ================= ADMIN ALL =================
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<?> getAllGrievances() {
        return ResponseEntity.ok(grievanceService.getAllGrievances());
    }

    // ================= CLOSE BY USER =================
    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> closeGrievance(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        String remarks = body != null ? body.get("remarks") : "Closed by user";

        grievanceService.closeByUser(id, userId, remarks);
        return ResponseEntity.ok("Grievance closed successfully");
    }

    // ================= ACCEPT =================
    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('OFFICER')")
    public ResponseEntity<?> acceptGrievance(@PathVariable Long id, Authentication authentication) {
        Long officerId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.acceptGrievance(id, officerId));
    }

    // ================= HISTORY =================
    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getGrievanceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(grievanceService.getGrievanceHistory(id));
    }

    // ================= COMMON METHOD =================
    private Long getUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("User not authenticated properly");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUserId();
    }
}
