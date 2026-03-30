package com.grievance.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.dto.response.GrievanceResponse;
import com.grievance.service.GrievanceService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/officer")
@AllArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('OFFICER')")
public class OfficerController {

    private GrievanceService grievanceService;

    @GetMapping("/assigned-grievances")
    public ResponseEntity<?> getAssignedGrievances(Authentication authentication) {
        log.debug("Fetching assigned grievances for officer: {}", authentication.getName());
        // Get officer ID from authentication
        List<GrievanceResponse> grievances = grievanceService.getAssignedGrievances(1L);
        return ResponseEntity.ok(grievances);
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getOfficerStatistics(Authentication authentication) {
        log.debug("Fetching officer statistics");
        // Return officer-specific statistics
        return ResponseEntity.ok("Officer Statistics");
    }
}
