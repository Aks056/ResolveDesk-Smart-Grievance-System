package com.grievance.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.dto.request.ChangePasswordRequest;
import com.grievance.dto.request.ProfileUpdateRequest;
import com.grievance.dto.response.UserResponse;
import com.grievance.security.CustomUserDetails;
import com.grievance.service.UserService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/user")
@AllArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private UserService userService;

    // ✅ Get Current User Profile
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        log.debug("Fetching profile for user: {}", authentication.getName());
        UserResponse userResponse = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(userResponse);
    }

    // ✅ Update Current User Profile
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        log.info("Updating profile for user: {}", userDetails.getUsername());
        UserResponse updated = userService.updateUserProfile(userDetails.getUserId(), request);
        return ResponseEntity.ok(updated);
    }

    // ✅ Change User Password
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        log.info("Changing password for user: {}", userDetails.getUsername());
        userService.changePassword(userDetails.getUserId(), request);
        return ResponseEntity.ok("Password changed successfully");
    }

    // --- Admin Endpoints (Using /api/user for consistency or keep /api/users?) ---
    // Actually, keep /api/users for bulk user management might be better, 
    // but the user wanted /api/user/profile.
    // I will use /api/user as the base for all user-related operations for now.

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.debug("Fetching all users - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        log.info("Deleting user: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        log.info("Activating user: {}", id);
        UserResponse user = userService.toggleUserActive(id, true);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        log.info("Deactivating user: {}", id);
        UserResponse user = userService.toggleUserActive(id, false);
        return ResponseEntity.ok(user);
    }

    // ✅ Change User Role (Admin Only)
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeRole(
            @PathVariable Long id, 
            @RequestBody java.util.Map<String, String> request) {
        String roleStr = request.get("role");
        log.info("Changing role for user {} to {}", id, roleStr);
        com.grievance.enums.Role role = com.grievance.enums.Role.valueOf(roleStr.toUpperCase());
        UserResponse user = userService.changeUserRole(id, role);
        return ResponseEntity.ok(user);
    }

    // ✅ Assign Department (Admin Only)
    @PutMapping("/{id}/department")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignDepartment(
            @PathVariable Long id, 
            @RequestBody java.util.Map<String, Long> request) {
        Long deptId = request.get("departmentId");
        log.info("Assigning department {} to user {}", deptId, id);
        UserResponse user = userService.assignDepartment(id, deptId);
        return ResponseEntity.ok(user);
    }
}
