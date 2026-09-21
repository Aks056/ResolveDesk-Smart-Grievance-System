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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.grievance.dto.request.GrievanceRequest;
import com.grievance.dto.request.UpdateStatusRequest;
import com.grievance.dto.response.GrievanceResponse;
import com.grievance.enums.Priority;
import com.grievance.security.CustomUserDetails;
import com.grievance.service.DepartmentService;
import com.grievance.service.GrievanceService;

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
            @RequestPart("data") @Valid GrievanceRequest data,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        GrievanceResponse grievance = grievanceService.submitGrievance(userId, data, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(grievance);
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getRecentGrievances(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.getRecentGrievances(userId));
    }

    // ================= DETAILS =================
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getGrievanceDetails(@PathVariable Long id, Authentication authentication) {
        Long requesterId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.getGrievanceDetails(id, requesterId));
    }

    // ================= ASSIGNED / DEPARTMENT SCOPE =================
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('OFFICER','ADMIN')")
    public ResponseEntity<?> getAssignedGrievances(
            @RequestParam(required = false) String scope,
            Authentication authentication) {
        Long officerId = getUserId(authentication);
        return ResponseEntity.ok(grievanceService.getOfficerDepartmentGrievances(officerId, scope));
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
    public ResponseEntity<?> getGlobalGrievances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        if (page < 0 || size < 1) throw new com.grievance.exception.BadRequestException("Invalid pagination");
        org.springframework.data.domain.Pageable pageable = 
            org.springframework.data.domain.PageRequest.of(page, Math.min(size, 100));
        var grievances = grievanceService.getGlobalGrievances(getUserId(authentication), pageable);
        return ResponseEntity.ok(grievances);
    }

    // ================= ADMIN ALL =================
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllGrievances(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = 
            org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<GrievanceResponse> grievances = 
            grievanceService.getAllGrievances(pageable);
        return ResponseEntity.ok(grievances);
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
    @PreAuthorize("hasAnyRole('OFFICER','ADMIN')")
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

    // ================= UPDATE PRIORITY =================
    @PutMapping("/{id}/priority")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<?> updateGrievancePriority(
            @PathVariable Long id,
            @RequestParam Priority priority) {
        return ResponseEntity.ok(grievanceService.updatePriority(id, priority));
    }

    // ================= LIST OFFICERS FOR ASSIGNMENT =================
    @GetMapping("/officers")
    @PreAuthorize("hasAnyRole('ADMIN','OFFICER')")
    public ResponseEntity<?> getAllOfficers() {
        return ResponseEntity.ok(grievanceService.getAllOfficers());
    }

    // ================= UPVOTE =================
    @PostMapping("/{id}/upvote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> toggleUpvote(@PathVariable Long id, Authentication authentication) {
        Long userId = getUserId(authentication);
        var response = grievanceService.toggleUpvote(id, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/{publicId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPublicGrievance(@PathVariable String publicId, Authentication authentication) {
        return ResponseEntity.ok(grievanceService.getPublicGrievance(publicId, getUserId(authentication)));
    }

    @PostMapping("/public/{publicId}/upvote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> togglePublicUpvote(@PathVariable String publicId, Authentication authentication) {
        return ResponseEntity.ok(grievanceService.togglePublicUpvote(publicId, getUserId(authentication)));
    }

    @PutMapping("/{id}/publication")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updatePublication(@PathVariable Long id,
            @Valid @RequestBody com.grievance.dto.request.PublicationRequest request, Authentication authentication) {
        return ResponseEntity.ok(grievanceService.updatePublication(id, getUserId(authentication), request));
    }

    @GetMapping("/{id}/attachments/evidence")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<org.springframework.core.io.Resource> downloadEvidence(@PathVariable Long id, Authentication authentication) {
        var evidence = grievanceService.getEvidence(id, getUserId(authentication));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header("Content-Disposition", org.springframework.http.ContentDisposition.attachment().filename("evidence").build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .header("Cache-Control", "private, no-store")
                .body(evidence);
    }

    // ================= COMMON METHOD =================
    private Long getUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("User not authenticated properly");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUserId();
    }
}
