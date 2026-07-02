package com.grievance.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.dto.response.GrievanceResponse;
import com.grievance.security.CustomUserDetails;
import com.grievance.service.GrievanceService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/officer")
@AllArgsConstructor
@PreAuthorize("hasRole('OFFICER')")
public class OfficerController {

    private GrievanceService grievanceService;

    @GetMapping("/assigned-grievances")
    public ResponseEntity<?> getAssignedGrievances(Authentication authentication) {
        log.debug("Fetching assigned grievances for officer: {}", authentication.getName());
        Long officerId = getUserIdFromAuthentication(authentication);
        List<GrievanceResponse> grievances = grievanceService.getAssignedGrievances(officerId);
        return ResponseEntity.ok(grievances);
    }

    @PostMapping("/grievances/{grievanceId}/assign/{officerId}")
    public ResponseEntity<?> assignGrievanceToOfficer(
            @PathVariable Long grievanceId,
            @PathVariable Long officerId,
            Authentication authentication) {
        log.info("Officer assigning grievance {} to officer {}", grievanceId, officerId);
        Long currentOfficerId = getUserIdFromAuthentication(authentication);
        var response = grievanceService.assignGrievanceToOfficer(grievanceId, officerId, currentOfficerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getOfficerStatistics(Authentication authentication) {
        log.debug("Fetching officer statistics");
        // Return officer-specific statistics
        return ResponseEntity.ok("Officer Statistics");
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("User not authenticated properly");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUserId();
    }
}
