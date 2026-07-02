package com.grievance.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.dto.response.DashboardResponse;
import com.grievance.service.DashboardService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@AllArgsConstructor
@PreAuthorize("isAuthenticated()")
public class DashboardController {

    private DashboardService dashboardService;

    @GetMapping("/user")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getUserDashboard(Authentication authentication) {
        log.debug("Fetching user dashboard for: {}", authentication.getName());
        Long userId = getUserIdFromAuthentication(authentication);
        DashboardResponse dashboard = dashboardService.getUserDashboard(userId);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/officer")
    @PreAuthorize("hasRole('OFFICER')")
    public ResponseEntity<?> getOfficerDashboard(Authentication authentication) {
        log.debug("Fetching officer dashboard for: {}", authentication.getName());
        Long officerId = getUserIdFromAuthentication(authentication);
        DashboardResponse dashboard = dashboardService.getOfficerDashboard(officerId);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminDashboard() {
        log.debug("Fetching admin dashboard");
        DashboardResponse dashboard = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        log.debug("Fetching statistics");
        return ResponseEntity.ok(dashboardService.getGrievancesByStatus());
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        com.grievance.security.CustomUserDetails user = (com.grievance.security.CustomUserDetails) authentication.getPrincipal();
        return user.getUserId();
    }
}
