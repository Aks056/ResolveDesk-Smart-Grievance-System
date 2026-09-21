package com.grievance.service;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.grievance.dto.request.GrievanceRequest;
import com.grievance.dto.request.PublicationRequest;
import com.grievance.dto.request.UpdateStatusRequest;
import com.grievance.dto.response.GrievanceHistoryResponse;
import com.grievance.dto.response.GrievanceQueueResponse;
import com.grievance.dto.response.GrievanceResponse;
import com.grievance.dto.response.OfficerDirectoryResponse;
import com.grievance.dto.response.PublicGrievanceResponse;
import com.grievance.dto.response.UpvoteResponse;
import com.grievance.entity.Grievance;
import com.grievance.entity.GrievanceHistory;
import com.grievance.entity.GrievanceUpvote;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.HistoryVisibility;
import com.grievance.enums.Priority;
import com.grievance.enums.Role;
import com.grievance.exception.BadRequestException;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.exception.UnauthorizedException;
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.FeedbackRepository;
import com.grievance.repository.GrievanceHistoryRepository;
import com.grievance.repository.GrievanceRepository;
import com.grievance.repository.GrievanceUpvoteRepository;
import com.grievance.repository.UserRepository;

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
    private GrievanceAccessPolicy accessPolicy;
    
    private static final Map<GrievanceStatus, Set<GrievanceStatus>> ALLOWED_TRANSITIONS = new HashMap<>();
    static {
        ALLOWED_TRANSITIONS.put(GrievanceStatus.PENDING, Set.of(GrievanceStatus.ASSIGNED, GrievanceStatus.IN_PROGRESS, GrievanceStatus.REJECTED));
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
                throw new RuntimeException("Failed to upload evidence");
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
    public GrievanceResponse getGrievanceDetails(Long grievanceId, Long requesterId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
        
        accessPolicy.requireRead(grievance, accessPolicy.requester(requesterId));
        return convertToResponse(grievance);
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getUserGrievances(Long userId) {
        User user = accessPolicy.requester(userId);
        if (user.getRole() != Role.USER) throw new org.springframework.security.access.AccessDeniedException("Citizen access required");
        return grievanceRepository.findByCitizenOrderByCreatedAtDesc(user).stream()
            .filter(grievance -> accessPolicy.canRead(grievance, user))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getRecentGrievances(Long userId) {
        User user = accessPolicy.requester(userId);
        
        List<Grievance> recentList;
        if (user.getRole() == com.grievance.enums.Role.ADMIN) {
            recentList = grievanceRepository.findAllByOrderByCreatedAtDesc(Pageable.ofSize(5))
                    .getContent();
        } else if (user.getRole() == com.grievance.enums.Role.OFFICER) {
            recentList = grievanceRepository.findByAssignedOfficerOrderByCreatedAtDesc(user).stream()
                    .filter(grievance -> accessPolicy.canRead(grievance, user))
                    .limit(5)
                    .collect(Collectors.toList());
        } else {
            recentList = grievanceRepository.findTop5ByCitizenOrderByCreatedAtDesc(user);
        }

        return recentList.stream()
            .filter(grievance -> accessPolicy.canRead(grievance, user))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<?> getOfficerDepartmentGrievances(Long officerId, String scope) {
        User officer = accessPolicy.requester(officerId);
        scope = scope == null ? "MY_TASKS" : scope.toUpperCase(java.util.Locale.ROOT);
        if (!Set.of("MY_TASKS", "DEPT_POOL", "RESOLVED").contains(scope)) {
            throw new BadRequestException("Invalid scope: expected MY_TASKS, DEPT_POOL or RESOLVED");
        }
        if (officer.getRole() != Role.ADMIN && officer.getRole() != Role.OFFICER) {
            throw new org.springframework.security.access.AccessDeniedException("Staff access required");
        }

        List<Grievance> list;
        if (officer.getRole() == com.grievance.enums.Role.ADMIN) {
            if ("MY_TASKS".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findActiveGrievancesByOfficer(officerId);
            } else if ("DEPT_POOL".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findPendingGrievances();
            } else if ("RESOLVED".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findByStatus(GrievanceStatus.RESOLVED);
            } else {
                list = grievanceRepository.findAllByOrderByCreatedAtDesc(Pageable.ofSize(100)).getContent();
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
            } else if ("RESOLVED".equalsIgnoreCase(scope)) {
                list = grievanceRepository.findResolvedGrievancesByOfficer(officerId);
            } else {
                list = grievanceRepository.findByDepartment_IdOrderByCreatedAtDesc(deptId);
            }
        }

        if ("DEPT_POOL".equals(scope)) {
            return list.stream()
                .filter(grievance -> (officer.getRole() == Role.ADMIN || accessPolicy.sameDepartment(grievance, officer))
                    && grievance.getAssignedOfficer() == null)
                .map(grievance -> new GrievanceQueueResponse(grievance.getId(), "Private grievance",
                    grievance.getDepartment().getId(), grievance.getDepartment().getName(),
                    grievance.getStatus(), grievance.getPriority(), grievance.getCreatedAt(), false))
                .toList();
        }
        return list.stream()
            .filter(grievance -> accessPolicy.canRead(grievance, officer))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getAssignedGrievances(Long officerId) {
        return getOfficerDepartmentGrievances(officerId, "MY_TASKS").stream()
                .map(GrievanceResponse.class::cast).toList();
    }

    @Transactional(readOnly = true)
    public org.springframework.core.io.Resource getEvidence(Long grievanceId, Long requesterId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
        accessPolicy.requireRead(grievance, accessPolicy.requester(requesterId));
        return fileStorageService.loadEvidence(grievance.getAttachmentUrl());
    }

    public GrievanceResponse updateStatus(Long grievanceId, Long officerId, UpdateStatusRequest request) {
        log.info("Updating grievance status. ID: {}, Officer: {}, New Status: {}",
                grievanceId, officerId, request.getStatus());

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

        User officer = accessPolicy.requester(officerId);
        accessPolicy.requireStaff(grievance, officer);
        if (request.getVisibility() == HistoryVisibility.PUBLIC) {
            throw new BadRequestException("Public remarks require a separate publication review");
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
                .visibility(request.getVisibility() == HistoryVisibility.PARTICIPANTS
                    && !remarks.toUpperCase(java.util.Locale.ROOT).contains("[INTERNAL]")
                    ? HistoryVisibility.PARTICIPANTS : HistoryVisibility.INTERNAL)
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
        User admin = accessPolicy.requester(adminId);
        accessPolicy.requireAdmin(admin);

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

        // Department scope: target officer must belong to the grievance's department
        if (officer.getRole() != Role.OFFICER || !Boolean.TRUE.equals(officer.getIsActive())) {
            throw new BadRequestException("Target must be an active officer");
        }
        if (officer.getDepartment() == null) {
            throw new BadRequestException("Officer " + officer.getFullName() + " does not belong to any department and cannot be assigned this grievance");
        }
        if (!grievance.getDepartment().getId().equals(officer.getDepartment().getId())) {
            throw new BadRequestException("Officer " + officer.getFullName() + " does not belong to the "
                    + grievance.getDepartment().getName() + " department and cannot be assigned this grievance");
        }

        // Validate status transition (same pattern as acceptGrievance/updateStatus)
        if (!ALLOWED_TRANSITIONS.getOrDefault(grievance.getStatus(), Set.of()).contains(GrievanceStatus.ASSIGNED)) {
            throw new BadRequestException("Cannot change status from " + grievance.getStatus() + " to " + GrievanceStatus.ASSIGNED);
        }

        // Capture real old status BEFORE mutating, so history reflects the actual prior state
        GrievanceStatus oldStatus = grievance.getStatus();
        grievance.setAssignedOfficer(officer);
        grievance.setStatus(GrievanceStatus.ASSIGNED);
        Grievance updatedGrievance = grievanceRepository.save(grievance);

        GrievanceHistory history = GrievanceHistory.builder()
                .grievance(updatedGrievance)
                .oldStatus(oldStatus)
                .newStatus(GrievanceStatus.ASSIGNED)
                .remarks("Assigned to officer: " + officer.getFullName())
                .visibility(HistoryVisibility.PARTICIPANTS)
                .updatedByUser(admin)
                .build();

        historyRepository.save(history);
        emailService.sendAssignmentEmail(officer.getEmail(), grievance.getGrievanceNumber());

        return convertToResponse(updatedGrievance);
    }

    @Transactional(readOnly = true)
    public Page<GrievanceResponse> getAllGrievances(Pageable pageable) {
        accessPolicy.requireAdmin(accessPolicy.currentRequester());
        log.info("Fetching all grievances - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return grievanceRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::convertToResponse);
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
    public Page<PublicGrievanceResponse> getGlobalGrievances(Long requesterId, Pageable pageable) {
        User requester = accessPolicy.requester(requesterId);
        Pageable bounded = org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100));
        return grievanceRepository.findByPublishedTrueOrderByCreatedAtDesc(bounded)
                .map(grievance -> publicResponse(grievance, requester.getId()));
    }

    private PublicGrievanceResponse publicResponse(Grievance grievance, Long requesterId) {
        return new PublicGrievanceResponse(grievance.getPublicId(), grievance.getPublicTitle(), grievance.getPublicSummary(),
                grievance.getDepartment().getName(), grievance.getStatus(),
                grievance.getCreatedAt() == null ? null : grievance.getCreatedAt().toLocalDate(),
                upvoteRepository.countByGrievanceId(grievance.getId()),
                upvoteRepository.existsByGrievanceIdAndUserId(grievance.getId(), requesterId));
    }

    @Transactional(readOnly = true)
    public PublicGrievanceResponse getPublicGrievance(String publicId, Long requesterId) {
        accessPolicy.requester(requesterId);
        return publicResponse(publishedGrievance(publicId), requesterId);
    }

    private Grievance publishedGrievance(String publicId) {
        return grievanceRepository.findByPublicIdAndPublishedTrue(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Published grievance", "publicId", publicId));
    }

    public UpvoteResponse togglePublicUpvote(String publicId, Long requesterId) {
        return toggleUpvote(publishedGrievance(publicId).getId(), requesterId);
    }

    public GrievanceResponse updatePublication(Long grievanceId, Long requesterId, PublicationRequest request) {
        accessPolicy.requireAdmin(accessPolicy.requester(requesterId));
        if (request.published() == null) throw new BadRequestException("Published is required");
        if ((request.publicTitle() != null && request.publicTitle().length() > 200)
                || (request.publicSummary() != null && request.publicSummary().length() > 2000)) {
            throw new BadRequestException("Public title or summary exceeds its maximum length");
        }
        if (request.published() && (request.publicTitle() == null || request.publicTitle().isBlank()
                || request.publicSummary() == null || request.publicSummary().isBlank())) {
            throw new BadRequestException("Reviewed public title and summary are required to publish");
        }
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
        grievance.setPublished(request.published());
        grievance.setPublicTitle(request.publicTitle());
        grievance.setPublicSummary(request.publicSummary());
        if (request.published() && grievance.getPublicId() == null) grievance.setPublicId(UUID.randomUUID().toString());
        return convertToResponse(grievanceRepository.save(grievance));
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

    String evidenceUrl = grievance.getAttachmentUrl() == null || grievance.getAttachmentUrl().isBlank()
            ? null : "/api/grievances/" + grievance.getId() + "/attachments/evidence";
    response.setAttachmentUrl(evidenceUrl);
    response.setImageUrl(evidenceUrl);
    response.setPublished(Boolean.TRUE.equals(grievance.getPublished()));
    response.setPrivateDetailsAvailable(true);

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

public UpvoteResponse toggleUpvote(Long grievanceId, Long userId) {
    log.info("Toggling upvote on grievance ID: {} for user ID: {}", grievanceId, userId);
    
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
            
    if (!Boolean.TRUE.equals(grievance.getPublished())) {
        throw new ResourceNotFoundException("Published grievance", "id", grievanceId);
    }
    User user = accessPolicy.requester(userId);
            
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
    
    upvoteRepository.flush();
    return new UpvoteResponse(upvoteRepository.countByGrievanceId(grievanceId), existingUpvote.isEmpty());
}
public void closeByUser(Long grievanceId, Long userId, String remarks) {
    Grievance grievance = grievanceRepository.findById(grievanceId)
        .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

    User requester = accessPolicy.requester(userId);
    accessPolicy.requireRead(grievance, requester);
    if (requester.getRole() != Role.USER) throw new org.springframework.security.access.AccessDeniedException("Citizen access required");

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
            .visibility(HistoryVisibility.PARTICIPANTS)
            .updatedByUser(citizen)
            .build();
    
    try {
        historyRepository.save(history);
        log.info("Grievance {} successfully closed and history archived.", grievanceId);
    } catch (org.springframework.dao.OptimisticLockingFailureException | jakarta.persistence.OptimisticLockException ex) {
        throw ex;
    } catch (Exception e) {
        log.error("Failed to save grievance history for {}: {}", grievanceId, e.getMessage());
        throw new RuntimeException("Database error: Could not archive status transition.");
    }
}

// ✅ ACCEPT GRIEVANCE BY OFFICER (Claim unassigned department grievance and start progress)
public GrievanceResponse acceptGrievance(Long grievanceId, Long officerId) {
    Grievance grievance = grievanceRepository.findByIdForClaim(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

    User officer = accessPolicy.requester(officerId);
    if (officer.getRole() != Role.ADMIN && officer.getRole() != Role.OFFICER) {
        throw new org.springframework.security.access.AccessDeniedException("Staff access required");
    }

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
            .visibility(HistoryVisibility.PARTICIPANTS)
            .updatedByUser(officer)
            .build();
    historyRepository.save(history);

    return convertToResponse(saved);
}

@Transactional(readOnly = true)
public List<GrievanceHistoryResponse> getGrievanceHistory(Long grievanceId) {
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
        User requester = accessPolicy.currentRequester();
        accessPolicy.requireRead(grievance, requester);
        return historyRepository.findByGrievanceOrderByUpdatedAtDesc(grievance).stream()
            .filter(history -> requester.getRole() != Role.USER || history.getEffectiveVisibility() != HistoryVisibility.INTERNAL)
            .map(this::convertHistoryToResponse)
            .collect(Collectors.toList());
}

private GrievanceHistoryResponse convertHistoryToResponse(GrievanceHistory history) {
    return GrievanceHistoryResponse.builder()
            .id(history.getId())
            .status(history.getNewStatus().toString())
            .remarks(history.getRemarks())
            .visibility(history.getEffectiveVisibility())
            .updatedBy(history.getUpdatedByUser() != null ? history.getUpdatedByUser().getFullName() : "System")
            .updatedAt(history.getUpdatedAt())
            .build();
}

public GrievanceResponse updatePriority(Long grievanceId, Priority priority) {
    log.info("Updating priority of grievance {} to {}", grievanceId, priority);
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

    User requester = accessPolicy.currentRequester();
    accessPolicy.requireStaff(grievance, requester);
    if (priority == null) throw new BadRequestException("Priority is required");
    Priority oldPriority = grievance.getPriority();
    grievance.setPriority(priority);
    Grievance saved = grievanceRepository.save(grievance);

    GrievanceHistory history = GrievanceHistory.builder()
            .grievance(saved)
            .oldStatus(saved.getStatus())
            .newStatus(saved.getStatus())
            .remarks("Priority updated from " + oldPriority + " to " + priority)
            .updatedByUser(requester)
            .build();
    historyRepository.save(history);

    return convertToResponse(saved);
}

@Transactional(readOnly = true)
public List<OfficerDirectoryResponse> getAllOfficers() {
    User requester = accessPolicy.currentRequester();
    if (requester.getRole() != Role.ADMIN && requester.getRole() != Role.OFFICER) {
        throw new org.springframework.security.access.AccessDeniedException("Staff access required");
    }
    log.info("Fetching all officers");
    return userRepository.findByRole(com.grievance.enums.Role.OFFICER).stream()
                .map(user -> new OfficerDirectoryResponse(user.getId(), user.getFirstName(), user.getLastName(),
                    user.getDepartment() == null ? null : user.getDepartment().getId(),
                    user.getDepartment() == null ? null : user.getDepartment().getName()))
            .collect(Collectors.toList());
}
}
