package com.grievance.service;

import java.util.List;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

import com.grievance.dto.request.GrievanceRequest;
import com.grievance.dto.request.UpdateStatusRequest;
import com.grievance.dto.response.GrievanceResponse;
import com.grievance.dto.response.GrievanceHistoryResponse;
import com.grievance.entity.Grievance;
import com.grievance.entity.GrievanceHistory;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.Priority;
import com.grievance.exception.BadRequestException;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.exception.UnauthorizedException;
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.FeedbackRepository;
import com.grievance.repository.GrievanceHistoryRepository;
import com.grievance.repository.GrievanceRepository;
import com.grievance.repository.UserRepository;
import com.grievance.entity.GrievanceUpvote;
import com.grievance.repository.GrievanceUpvoteRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class GrievanceService {

    private GrievanceRepository grievanceRepository;
    private GrievanceHistoryRepository historyRepository;
    private UserRepository userRepository;
    private DepartmentRepository departmentRepository;
    private FeedbackRepository feedbackRepository;
    private EmailService emailService;
    private FileStorageService fileStorageService;
    private ModelMapper modelMapper;
    private GrievanceUpvoteRepository upvoteRepository;
    
    private static final Map<GrievanceStatus, Set<GrievanceStatus>> ALLOWED_TRANSITIONS = new HashMap<>();
    static {
        ALLOWED_TRANSITIONS.put(GrievanceStatus.PENDING, Set.of(GrievanceStatus.ASSIGNED, GrievanceStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(GrievanceStatus.ASSIGNED, Set.of(GrievanceStatus.IN_PROGRESS, GrievanceStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(GrievanceStatus.IN_PROGRESS, Set.of(GrievanceStatus.RESOLVED, GrievanceStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(GrievanceStatus.RESOLVED, Set.of());
        ALLOWED_TRANSITIONS.put(GrievanceStatus.REJECTED, Set.of());
        ALLOWED_TRANSITIONS.put(GrievanceStatus.CLOSED_BY_USER, Set.of());
    }

    public GrievanceResponse submitGrievance(Long userId, GrievanceRequest request, MultipartFile file) {
        log.info("Submitting new grievance for user ID: {}", userId);

        User citizen = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        var department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", request.getDepartmentId()));

        String grievanceNumber = "GRV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Handle file upload
        String attachmentUrl = null;
        if (file != null && !file.isEmpty()) {
            try {
                attachmentUrl = fileStorageService.storeFile(file);
                log.info("File uploaded successfully: {}", attachmentUrl);
            } catch (IOException e) {
                log.error("Error uploading file: {}", e.getMessage());
                throw new RuntimeException("Failed to upload file: " + e.getMessage());
            }
        }

        Grievance grievance = Grievance.builder()
                .grievanceNumber(grievanceNumber)
                .citizen(citizen)
                .department(department)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(GrievanceStatus.PENDING)
                .resolutionDays(request.getPriority().getResolutionDays())
                .attachmentUrl(attachmentUrl)
                .build();

        Grievance savedGrievance = grievanceRepository.save(grievance);
        log.info("Grievance submitted: {} (Number: {})", savedGrievance.getId(), grievanceNumber);

        emailService.sendGrievanceSubmittedEmail(citizen.getEmail(), grievanceNumber);
        return convertToResponse(savedGrievance);
    }

    @Transactional(readOnly = true)
    public GrievanceResponse getGrievanceDetails(Long grievanceId, Long requesterId, boolean isAdminOrOfficer) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
        
        GrievanceResponse res = convertToResponse(grievance);
        
        // Privacy: Mask name if requester is neither owner nor admin/officer
        if (!isAdminOrOfficer && !java.util.Objects.equals(grievance.getCitizen().getId(), requesterId)) {
            res.setCitizenName(maskName(res.getCitizenName()));
        }
        
        return res;
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getUserGrievances(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return grievanceRepository.findByCitizenOrderByCreatedAtDesc(user).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getRecentGrievances(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        List<Grievance> recentList;
        if (user.getRole() == com.grievance.enums.Role.ADMIN) {
            recentList = grievanceRepository.findAllByOrderByCreatedAtDesc().stream()
                    .limit(5)
                    .collect(Collectors.toList());
        } else if (user.getRole() == com.grievance.enums.Role.OFFICER) {
            recentList = grievanceRepository.findByAssignedOfficerOrderByCreatedAtDesc(user).stream()
                    .limit(5)
                    .collect(Collectors.toList());
        } else {
            recentList = grievanceRepository.findTop5ByCitizenOrderByCreatedAtDesc(user);
        }

        return recentList.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getOfficerDepartmentGrievances(Long officerId, String scope) {
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

        List<Grievance> list;
        if (officer.getRole() == com.grievance.enums.Role.ADMIN) {
            if ("MY_TASKS".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findActiveGrievancesByOfficer(officerId);
            } else if ("DEPT_POOL".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findPendingGrievances();
            } else if ("RESOLVED".equalsIgnoreCase(scope) || "RESOLVED_HISTORY".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findByStatus(GrievanceStatus.RESOLVED);
            } else {
                list = grievanceRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            if (officer.getDepartment() == null) {
                throw new BadRequestException("Officer is not assigned to any department");
            }
            Long deptId = officer.getDepartment().getId();
            if ("DEPT_POOL".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findDeptPoolGrievances(deptId);
            } else if ("MY_TASKS".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findActiveGrievancesByOfficer(officerId);
            } else if ("RESOLVED".equalsIgnoreCase(scope) || "RESOLVED_HISTORY".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findResolvedGrievancesByOfficer(officerId);
            } else {
                list = grievanceRepository.findByDepartment_IdOrderByCreatedAtDesc(deptId);
            }
        }

        return list.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getAssignedGrievances(Long officerId) {
        return getOfficerDepartmentGrievances(officerId, null);
    }

    public GrievanceResponse updateStatus(Long grievanceId, Long officerId, UpdateStatusRequest request) {
        log.info("Updating grievance status. ID: {}, Officer: {}, New Status: {}",
                grievanceId, officerId, request.getStatus());

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

        boolean isAdmin = officer.getRole() == com.grievance.enums.Role.ADMIN;
        if (!isAdmin) {
            if (officer.getDepartment() == null || !grievance.getDepartment().getId().equals(officer.getDepartment().getId())) {
                throw new UnauthorizedException("You cannot modify grievances outside your assigned department");
            }
            if (grievance.getAssignedOfficer() == null || !grievance.getAssignedOfficer().getId().equals(officerId)) {
                throw new UnauthorizedException("Only the assigned officer or an administrator can update this grievance");
            }
        }

        // Validate status transition
        if (!ALLOWED_TRANSITIONS.getOrDefault(grievance.getStatus(), Set.of()).contains(request.getStatus())) {
            throw new BadRequestException("Cannot change status from " + grievance.getStatus() + " to " + request.getStatus());
        }
        String remarks = request.getEffectiveRemarks();
        if ((request.getStatus() == GrievanceStatus.RESOLVED || request.getStatus() == GrievanceStatus.REJECTED)
                && (remarks == null || remarks.trim().isEmpty())) {
            throw new BadRequestException("Resolution remarks are required when resolving or rejecting a grievance");
        }

        GrievanceStatus oldStatus = grievance.getStatus();
        grievance.setStatus(request.getStatus());
        Grievance updatedGrievance = grievanceRepository.save(grievance);

        GrievanceHistory history = GrievanceHistory.builder()
                .grievance(updatedGrievance)
                .oldStatus(oldStatus)
                .newStatus(request.getStatus())
                .remarks(remarks.isEmpty() ? "Status updated to " + request.getStatus() : remarks)
                .updatedByUser(officer)
                .build();

        historyRepository.save(history);
        log.info("Grievance status updated: {} -> {}", grievanceId, request.getStatus());

        emailService.sendStatusUpdateEmail(updatedGrievance.getCitizen().getEmail(),
                updatedGrievance.getGrievanceNumber(), request.getStatus().toString());

        return convertToResponse(updatedGrievance);
    }

    public GrievanceResponse assignGrievanceToOfficer(Long grievanceId, Long officerId, Long adminId) {
        log.info("Assigning grievance {} to officer {}", grievanceId, officerId);

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

        grievance.setAssignedOfficer(officer);
        grievance.setStatus(GrievanceStatus.ASSIGNED);
        Grievance updatedGrievance = grievanceRepository.save(grievance);

        User admin = userRepository.findById(adminId).orElse(null);
        GrievanceHistory history = GrievanceHistory.builder()
                .grievance(updatedGrievance)
                .oldStatus(GrievanceStatus.PENDING)
                .newStatus(GrievanceStatus.ASSIGNED)
                .remarks("Assigned to officer: " + officer.getFullName())
                .updatedByUser(admin)
                .build();

        historyRepository.save(history);
        emailService.sendAssignmentEmail(officer.getEmail(), grievance.getGrievanceNumber());

        return convertToResponse(updatedGrievance);
    }

    @Transactional(readOnly = true)
    public Page<GrievanceResponse> searchGrievances(GrievanceStatus status, Priority priority, Pageable pageable) {
        log.debug("Searching grievances - status: {}, priority: {}", status, priority);
        return grievanceRepository.findAll(pageable).map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getAllGrievances() {
        return grievanceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getGrievanceCountByStatus(GrievanceStatus status) {
        return grievanceRepository.countByStatus(status);
    }

    public void deleteGrievance(Long grievanceId) {
        log.info("Deleting grievance: {}", grievanceId);
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
        grievanceRepository.delete(grievance);
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getGlobalGrievances(boolean maskNames) {
        log.info("Fetching global grievances. Masking enabled: {}", maskNames);
        return grievanceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(g -> {
                    GrievanceResponse res = convertToResponse(g);
                    if (maskNames && res.getCitizenName() != null) {
                        res.setCitizenName(maskName(res.getCitizenName()));
                    }
                    return res;
                })
                .collect(Collectors.toList());
    }

    private String maskName(String name) {
        if (name == null || name.isEmpty()) return "Anonymous";
        String[] parts = name.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.length() > 1) {
                sb.append(part.charAt(0)).append("*** ");
            } else {
                sb.append(part).append(" ");
            }
        }
        return sb.toString().trim();
    }

    private GrievanceResponse convertToResponse(Grievance grievance) {

    GrievanceResponse response = modelMapper.map(grievance, GrievanceResponse.class);

    response.setCitizenName(grievance.getCitizen().getFullName());
    response.setCitizenId(grievance.getCitizen().getId());

    if (grievance.getAssignedOfficer() != null) {
        response.setAssignedOfficerId(grievance.getAssignedOfficer().getId());
        response.setAssignedOfficerName(grievance.getAssignedOfficer().getFullName());
    }

    response.setDepartmentId(grievance.getDepartment().getId());
    response.setDepartmentName(grievance.getDepartment().getName());

    Double avgRating = feedbackRepository.getAverageRatingForGrievance(grievance);
    response.setAverageRating(avgRating);

    // Populate imageUrl from attachmentUrl if present
    if (grievance.getAttachmentUrl() != null) {
        response.setImageUrl("/" + grievance.getAttachmentUrl());
    }

    // Upvote data
    int upvoteCount = upvoteRepository.countByGrievanceId(grievance.getId());
    response.setUpvoteCount(upvoteCount);
    
    Long currentUserId = getCurrentUserId();
    if (currentUserId != null) {
        response.setHasUpvoted(upvoteRepository.existsByGrievanceIdAndUserId(grievance.getId(), currentUserId));
    } else {
        response.setHasUpvoted(false);
    }

    return response;
}

private Long getCurrentUserId() {
    try {
        org.springframework.security.core.Authentication authentication = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof com.grievance.security.CustomUserDetails) {
            return ((com.grievance.security.CustomUserDetails) authentication.getPrincipal()).getUserId();
        }
    } catch (Exception e) {
        log.error("Error retrieving user from SecurityContext", e);
    }
    return null;
}

public GrievanceResponse toggleUpvote(Long grievanceId, Long userId) {
    log.info("Toggling upvote on grievance ID: {} for user ID: {}", grievanceId, userId);
    
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
            
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
    java.util.Optional<GrievanceUpvote> existingUpvote = 
            upvoteRepository.findByGrievanceIdAndUserId(grievanceId, userId);
            
    if (existingUpvote.isPresent()) {
        upvoteRepository.delete(existingUpvote.get());
        log.info("Removed upvote for grievance {} by user {}", grievanceId, userId);
    } else {
        GrievanceUpvote upvote = GrievanceUpvote.builder()
                .grievance(grievance)
                .user(user)
                .build();
        upvoteRepository.save(upvote);
        log.info("Added upvote for grievance {} by user {}", grievanceId, userId);
    }
    
    return convertToResponse(grievance);
}
public void closeByUser(Long grievanceId, Long userId, String remarks) {
    Grievance grievance = grievanceRepository.findById(grievanceId)
        .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

    log.info("[AUTH-TRACE] Author ID: {} | Requestor ID: {} | Types: {} / {}", 
        grievance.getCitizen().getId(), userId, 
        grievance.getCitizen().getId().getClass().getSimpleName(), 
        userId != null ? userId.getClass().getSimpleName() : "null");
    
    if (!java.util.Objects.equals(grievance.getCitizen().getId(), userId)) {
        log.warn("Unauthorized close attempt: Grievance {} owned by {}, attempted by {}", 
            grievanceId, grievance.getCitizen().getId(), userId);
        throw new UnauthorizedException("Unauthorized to close this grievance. You are not the original author.");
    }

    if (grievance.getStatus() == GrievanceStatus.RESOLVED || grievance.getStatus() == GrievanceStatus.CLOSED_BY_USER) {
        throw new BadRequestException("Grievance is already closed or resolved.");
    }

    // Capture status and citizen before save
    GrievanceStatus oldStatus = grievance.getStatus();
    User citizen = grievance.getCitizen();
    
    if (citizen == null) {
        log.error("Critical integrity error: Grievance {} exists but has no citizen owner!", grievanceId);
        throw new RuntimeException("Internal data integrity error: Owner not found.");
    }

    log.info("Transitioning grievance {} status: {} -> {}", grievanceId, oldStatus, GrievanceStatus.CLOSED_BY_USER);
    
    grievance.setStatus(GrievanceStatus.CLOSED_BY_USER);
    Grievance saved = grievanceRepository.save(grievance);

    GrievanceHistory history = GrievanceHistory.builder()
            .grievance(saved)
            .oldStatus(oldStatus)
            .newStatus(GrievanceStatus.CLOSED_BY_USER)
            .remarks(remarks != null ? remarks : "Closed by user via portal")
            .updatedByUser(citizen)
            .build();
    
    try {
        historyRepository.save(history);
        log.info("Grievance {} successfully closed and history archived.", grievanceId);
    } catch (Exception e) {
        log.error("Failed to save grievance history for {}: {}", grievanceId, e.getMessage());
        throw new RuntimeException("Database error: Could not archive status transition.");
    }
}

// ✅ ACCEPT GRIEVANCE BY OFFICER (Claim unassigned department grievance and start progress)
public GrievanceResponse acceptGrievance(Long grievanceId, Long officerId) {
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

    User officer = userRepository.findById(officerId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

    if (officer.getRole() != com.grievance.enums.Role.ADMIN) {
        if (officer.getDepartment() == null) {
            throw new BadRequestException("Officer does not belong to any department");
        }
        if (!grievance.getDepartment().getId().equals(officer.getDepartment().getId())) {
            throw new UnauthorizedException("You cannot accept grievances outside your assigned department");
        }
    }

    if (grievance.getStatus() == GrievanceStatus.RESOLVED || grievance.getStatus() == GrievanceStatus.REJECTED || grievance.getStatus() == GrievanceStatus.CLOSED_BY_USER) {
        throw new BadRequestException("Cannot accept a completed or closed grievance");
    }

    if (grievance.getAssignedOfficer() != null && !grievance.getAssignedOfficer().getId().equals(officerId)) {
        throw new BadRequestException("Grievance is already assigned to officer: " + grievance.getAssignedOfficer().getFullName());
    }

    // Validate status transition
    if (!ALLOWED_TRANSITIONS.getOrDefault(grievance.getStatus(), Set.of()).contains(GrievanceStatus.IN_PROGRESS)) {
        throw new BadRequestException("Cannot change status from " + grievance.getStatus() + " to " + GrievanceStatus.IN_PROGRESS);
    }
    GrievanceStatus oldStatus = grievance.getStatus();
    grievance.setAssignedOfficer(officer);
    grievance.setStatus(GrievanceStatus.IN_PROGRESS);
    Grievance saved = grievanceRepository.save(grievance);

    GrievanceHistory history = GrievanceHistory.builder()
            .grievance(saved)
            .oldStatus(oldStatus)
            .newStatus(GrievanceStatus.IN_PROGRESS)
            .remarks("Accepted and taken up by officer: " + officer.getFullName())
            .updatedByUser(officer)
            .build();
    historyRepository.save(history);

    return convertToResponse(saved);
}

@Transactional(readOnly = true)
public List<GrievanceHistoryResponse> getGrievanceHistory(Long grievanceId) {
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
    return historyRepository.findByGrievanceOrderByUpdatedAtDesc(grievance).stream()
            .map(this::convertHistoryToResponse)
            .collect(Collectors.toList());
}

private GrievanceHistoryResponse convertHistoryToResponse(GrievanceHistory history) {
    return GrievanceHistoryResponse.builder()
            .id(history.getId())
            .status(history.getNewStatus().toString())
            .remarks(history.getRemarks())
            .updatedBy(history.getUpdatedByUser() != null ? history.getUpdatedByUser().getFullName() : "System")
            .updatedAt(history.getUpdatedAt())
            .build();
}

public GrievanceResponse updatePriority(Long grievanceId, Priority priority) {
    log.info("Updating priority of grievance {} to {}", grievanceId, priority);
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

    Priority oldPriority = grievance.getPriority();
    grievance.setPriority(priority);
    Grievance saved = grievanceRepository.save(grievance);

    GrievanceHistory history = GrievanceHistory.builder()
            .grievance(saved)
            .oldStatus(saved.getStatus())
            .newStatus(saved.getStatus())
            .remarks("Priority updated from " + oldPriority + " to " + priority)
            .build();
    historyRepository.save(history);

    return convertToResponse(saved);
}

@Transactional(readOnly = true)
public List<com.grievance.dto.response.UserResponse> getAllOfficers() {
    log.info("Fetching all officers");
    return userRepository.findByRole(com.grievance.enums.Role.OFFICER).stream()
            .map(user -> modelMapper.map(user, com.grievance.dto.response.UserResponse.class))
            .collect(Collectors.toList());
}
}
