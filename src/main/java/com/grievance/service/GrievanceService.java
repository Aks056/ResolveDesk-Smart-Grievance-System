package com.grievance.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

import com.grievance.dto.request.UpdateStatusRequest;
import com.grievance.dto.response.GrievanceResponse;
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

    public GrievanceResponse submitGrievance(Long userId, String title, String description, 
            Long departmentId, Priority priority, MultipartFile file) {
        log.info("Submitting new grievance for user ID: {}", userId);

        User citizen = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        var department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

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
                .title(title)
                .description(description)
                .priority(priority)
                .status(GrievanceStatus.PENDING)
                .resolutionDays(priority.getResolutionDays())
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
        return grievanceRepository.findTop5ByCitizenOrderByCreatedAtDesc(user).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GrievanceResponse> getAssignedGrievances(Long officerId) {
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));
        return grievanceRepository.findByAssignedOfficerOrderByCreatedAtDesc(officer).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public GrievanceResponse updateStatus(Long grievanceId, Long officerId, UpdateStatusRequest request) {
        log.info("Updating grievance status. ID: {}, Officer: {}, New Status: {}",
                grievanceId, officerId, request.getStatus());

        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", officerId));

        if (grievance.getAssignedOfficer() == null || !grievance.getAssignedOfficer().getId().equals(officerId)) {
            throw new UnauthorizedException("Only assigned officer can update this grievance");
        }

        GrievanceStatus oldStatus = grievance.getStatus();
        grievance.setStatus(request.getStatus());
        Grievance updatedGrievance = grievanceRepository.save(grievance);

        GrievanceHistory history = GrievanceHistory.builder()
                .grievance(updatedGrievance)
                .oldStatus(oldStatus)
                .newStatus(request.getStatus())
                .remarks(request.getRemarks())
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

    return response;
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

// ✅ ACCEPT GRIEVANCE BY OFFICER
public GrievanceResponse acceptGrievance(Long grievanceId, Long officerId) {
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

    if (!grievance.getAssignedOfficer().getId().equals(officerId)) {
        throw new UnauthorizedException("Unauthorized to accept this grievance");
    }

    if (grievance.getStatus() != GrievanceStatus.ASSIGNED) {
        throw new BadRequestException("Grievance can only be accepted if it is in ASSIGNED status");
    }

    GrievanceStatus oldStatus = grievance.getStatus();
    grievance.setStatus(GrievanceStatus.IN_PROGRESS);
    Grievance saved = grievanceRepository.save(grievance);

    GrievanceHistory history = GrievanceHistory.builder()
            .grievance(saved)
            .oldStatus(oldStatus)
            .newStatus(GrievanceStatus.IN_PROGRESS)
            .remarks("Accepted by officer")
            .updatedByUser(grievance.getAssignedOfficer())
            .build();
    historyRepository.save(history);

    return convertToResponse(saved);
}

@Transactional(readOnly = true)
public List<GrievanceHistory> getGrievanceHistory(Long grievanceId) {
    Grievance grievance = grievanceRepository.findById(grievanceId)
            .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));
    return historyRepository.findByGrievanceOrderByUpdatedAtDesc(grievance);
}
}
