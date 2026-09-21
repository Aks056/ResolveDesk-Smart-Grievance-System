package com.grievance.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grievance.dto.request.PublicationRequest;
import com.grievance.dto.request.UpdateStatusRequest;
import com.grievance.dto.response.GrievanceQueueResponse;
import com.grievance.entity.Department;
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
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.FeedbackRepository;
import com.grievance.repository.GrievanceHistoryRepository;
import com.grievance.repository.GrievanceRepository;
import com.grievance.repository.GrievanceUpvoteRepository;
import com.grievance.repository.UserRepository;
import com.grievance.security.CustomUserDetails;

class GrievancePrivacyTest {
    private final GrievanceRepository grievances = mock(GrievanceRepository.class);
    private final GrievanceHistoryRepository histories = mock(GrievanceHistoryRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final DepartmentRepository departments = mock(DepartmentRepository.class);
    private final FeedbackRepository feedback = mock(FeedbackRepository.class);
    private final FileStorageService storage = mock(FileStorageService.class);
    private final GrievanceUpvoteRepository upvotes = mock(GrievanceUpvoteRepository.class);
    private final GrievanceAccessPolicy policy = new GrievanceAccessPolicy(users);
    private final GrievanceService service = new GrievanceService(grievances, histories, users,
            departments, feedback, mock(EmailService.class), storage, new com.grievance.config.AppConfig().modelMapper(), upvotes, policy);
    private final ObjectMapper json = new ObjectMapper().findAndRegisterModules();
    private final Department department = Department.builder().id(10L).name("Water").build();
    private final User owner = User.builder().id(1L).role(Role.USER).firstName("Private").lastName("Citizen").build();
    private final User officer = User.builder().id(2L).role(Role.OFFICER).department(department).build();
    private final User admin = User.builder().id(3L).role(Role.ADMIN).build();
    private final User stranger = User.builder().id(4L).role(Role.USER).build();
    private Grievance grievance;

    @BeforeEach
    void setup() {
        for (User user : List.of(owner, officer, admin, stranger)) when(users.findById(user.getId())).thenReturn(Optional.of(user));
        grievance = Grievance.builder().id(20L).citizen(owner).assignedOfficer(officer).department(department)
                .title("Private title").description("Private narrative").attachmentUrl("uploads/private-file.pdf")
                .createdAt(LocalDateTime.of(2026, 9, 21, 12, 30)).build();
        when(grievances.findById(20L)).thenReturn(Optional.of(grievance));
        when(grievances.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(User user) {
        CustomUserDetails principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @Test
    void privateDetailsRequireAccessAndNeverExposeStoragePath() {
        assertThrows(AccessDeniedException.class, () -> service.getGrievanceDetails(20L, stranger.getId()));
        var response = service.getGrievanceDetails(20L, owner.getId());
        assertEquals("/api/grievances/20/attachments/evidence", response.getAttachmentUrl());
        assertEquals(response.getAttachmentUrl(), response.getImageUrl());
        assertTrue(response.isPrivateDetailsAvailable());
        assertFalse(response.getPublished());
        grievance.setAttachmentUrl(null);
        assertNull(service.getGrievanceDetails(20L, owner.getId()).getImageUrl());
    }

    @Test
    void uploadFailureDoesNotExposeStoragePath() throws java.io.IOException {
        var request = mock(com.grievance.dto.request.GrievanceRequest.class);
        var file = mock(org.springframework.web.multipart.MultipartFile.class);
        when(request.getDepartmentId()).thenReturn(department.getId());
        when(departments.findById(department.getId())).thenReturn(Optional.of(department));
        when(storage.storeFile(file)).thenThrow(new java.io.IOException("private-storage/location.pdf"));
        RuntimeException failure = assertThrows(RuntimeException.class, () -> service.submitGrievance(owner.getId(), request, file));
        assertEquals("Failed to upload evidence", failure.getMessage());
    }

    @Test
    void publicFeedUsesOnlyPublishedQueryBoundedPaginationAndExactSummaryFields() {
        grievance.setPublished(true);
        grievance.setPublicId(UUID.randomUUID().toString());
        grievance.setPublicTitle("Reviewed title");
        grievance.setPublicSummary("Reviewed summary");
        when(grievances.findByPublishedTrueOrderByCreatedAtDesc(any())).thenReturn(new PageImpl<>(List.of(grievance)));
        var page = service.getGlobalGrievances(stranger.getId(), PageRequest.of(0, 500));
        verify(grievances).findByPublishedTrueOrderByCreatedAtDesc(PageRequest.of(0, 100));
        verify(grievances, never()).findAllByOrderByCreatedAtDesc(any());
        var tree = json.valueToTree(page.getContent().get(0));
        Set<String> fields = new java.util.HashSet<>();
        tree.fieldNames().forEachRemaining(fields::add);
        assertEquals(Set.of("publicId", "publicTitle", "publicSummary", "departmentName", "status", "createdDate", "upvoteCount", "hasUpvoted"), fields);
        assertEquals("Reviewed summary", tree.get("publicSummary").asText());
        assertFalse(tree.toString().contains("Private"));
    }

    @Test
    void publicationRequiresAdminAndReviewedBoundedTextWithNoAutomaticCopy() {
        assertThrows(AccessDeniedException.class, () -> service.updatePublication(20L, owner.getId(), new PublicationRequest(true, "Title", "Summary")));
        assertThrows(BadRequestException.class, () -> service.updatePublication(20L, admin.getId(), new PublicationRequest(true, " ", "Summary")));
        assertThrows(BadRequestException.class, () -> service.updatePublication(20L, admin.getId(), new PublicationRequest(true, "Title", "x".repeat(2001))));
        assertNull(grievance.getPublicTitle());
        service.updatePublication(20L, admin.getId(), new PublicationRequest(true, "Reviewed", "Reviewed summary"));
        assertNotNull(UUID.fromString(grievance.getPublicId()));
        assertEquals("Reviewed", grievance.getPublicTitle());
        service.updatePublication(20L, admin.getId(), new PublicationRequest(false, null, null));
        assertFalse(grievance.getPublished());
    }

    @Test
    void votingRequiresPublicationAndReturnsOnlyVoteState() {
        assertThrows(ResourceNotFoundException.class, () -> service.toggleUpvote(20L, stranger.getId()));
        grievance.setPublished(null);
        assertThrows(ResourceNotFoundException.class, () -> service.toggleUpvote(20L, stranger.getId()));
        grievance.setPublished(true);
        when(upvotes.findByGrievanceIdAndUserId(20L, stranger.getId())).thenReturn(Optional.empty());
        when(upvotes.countByGrievanceId(20L)).thenReturn(1);
        var tree = json.valueToTree(service.toggleUpvote(20L, stranger.getId()));
        assertEquals(2, tree.size());
        assertTrue(tree.get("hasUpvoted").asBoolean());
        assertEquals(1, tree.get("upvoteCount").asInt());
        when(upvotes.findByGrievanceIdAndUserId(20L, stranger.getId())).thenReturn(Optional.of(GrievanceUpvote.builder().build()));
        assertFalse(service.toggleUpvote(20L, stranger.getId()).hasUpvoted());
        assertThrows(ResourceNotFoundException.class, () -> service.getPublicGrievance("missing", stranger.getId()));
    }

    @Test
    void ownerCannotSeeInternalNullOrLegacyPrefixedHistory() {
        var participant = GrievanceHistory.builder().newStatus(GrievanceStatus.PENDING).remarks("Safe event").visibility(HistoryVisibility.PARTICIPANTS).build();
        var internal = GrievanceHistory.builder().newStatus(GrievanceStatus.PENDING).remarks("Staff note").build();
        var legacy = GrievanceHistory.builder().newStatus(GrievanceStatus.PENDING).remarks("Legacy secret").visibility(null).build();
        var prefixed = GrievanceHistory.builder().newStatus(GrievanceStatus.PENDING).remarks("[INTERNAL] secret").visibility(HistoryVisibility.PARTICIPANTS).build();
        var publicEvent = GrievanceHistory.builder().newStatus(GrievanceStatus.PENDING).remarks("Reviewed event").visibility(HistoryVisibility.PUBLIC).build();
        when(histories.findByGrievanceOrderByUpdatedAtDesc(grievance)).thenReturn(List.of(participant, internal, legacy, prefixed, publicEvent));
        authenticate(owner);
        assertEquals(List.of(HistoryVisibility.PARTICIPANTS, HistoryVisibility.PUBLIC), service.getGrievanceHistory(20L).stream().map(result -> result.getVisibility()).toList());
        authenticate(officer);
        assertEquals(5, service.getGrievanceHistory(20L).size());
        authenticate(stranger);
        assertThrows(AccessDeniedException.class, () -> service.getGrievanceHistory(20L));
    }

    @Test
    void statusHistoryDefaultsInternalAndRejectsPublicRemarks() {
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus(GrievanceStatus.IN_PROGRESS);
        request.setVisibility(HistoryVisibility.PUBLIC);
        assertThrows(BadRequestException.class, () -> service.updateStatus(20L, officer.getId(), request));
        request.setVisibility(HistoryVisibility.PARTICIPANTS);
        request.setRemarks("[INTERNAL] must stay private");
        service.updateStatus(20L, officer.getId(), request);
        var captured = org.mockito.ArgumentCaptor.forClass(GrievanceHistory.class);
        verify(histories).save(captured.capture());
        assertEquals(HistoryVisibility.INTERNAL, captured.getValue().getVisibility());
    }

    @Test
    void queueIsMinimalAndDefaultScopeDoesNotReturnDepartmentCases() {
        grievance.setAssignedOfficer(null);
        when(grievances.findDeptPoolGrievances(department.getId())).thenReturn(List.of(grievance));
        var queue = service.getOfficerDepartmentGrievances(officer.getId(), "DEPT_POOL");
        assertInstanceOf(GrievanceQueueResponse.class, queue.get(0));
        var tree = json.valueToTree(queue.get(0));
        assertEquals(8, tree.size());
        assertEquals("Private grievance", tree.get("title").asText());
        assertFalse(tree.get("privateDetailsAvailable").asBoolean());
        assertFalse(tree.has("citizenId"));
        when(grievances.findPendingGrievances()).thenReturn(List.of(grievance));
        assertInstanceOf(GrievanceQueueResponse.class, service.getOfficerDepartmentGrievances(admin.getId(), "DEPT_POOL").get(0));
        when(grievances.findActiveGrievancesByOfficer(officer.getId())).thenReturn(List.of(grievance));
        assertTrue(service.getOfficerDepartmentGrievances(officer.getId(), null).isEmpty());
        assertThrows(BadRequestException.class, () -> service.getOfficerDepartmentGrievances(officer.getId(), "ALL"));
        assertThrows(AccessDeniedException.class, () -> service.getOfficerDepartmentGrievances(owner.getId(), "DEPT_POOL"));
    }

    @Test
    void officerListsAndPriorityRespectCurrentAssignmentAndDepartment() {
        when(grievances.findActiveGrievancesByOfficer(officer.getId())).thenReturn(List.of(grievance));
        when(grievances.findByAssignedOfficerOrderByCreatedAtDesc(officer)).thenReturn(List.of(grievance));
        officer.setDepartment(Department.builder().id(99L).build());
        assertTrue(service.getOfficerDepartmentGrievances(officer.getId(), "MY_TASKS").isEmpty());
        assertTrue(service.getRecentGrievances(officer.getId()).isEmpty());
        authenticate(officer);
        assertThrows(AccessDeniedException.class, () -> service.updatePriority(20L, Priority.HIGH));
        authenticate(owner);
        assertThrows(AccessDeniedException.class, () -> service.updatePriority(20L, Priority.HIGH));
        authenticate(admin);
        service.updatePriority(20L, Priority.HIGH);
        assertEquals(Priority.HIGH, grievance.getPriority());
    }

    @Test
    void evidenceAuthorizationPrecedesFileResolution() {
        assertThrows(AccessDeniedException.class, () -> service.getEvidence(20L, stranger.getId()));
        verifyNoInteractions(storage);
        service.getEvidence(20L, owner.getId());
        verify(storage).loadEvidence(grievance.getAttachmentUrl());
    }

    @Test
    void feedbackAndRatingDoNotBypassCaseAccess() {
        FeedbackService feedbackService = new FeedbackService(feedback, grievances, users, policy);
        authenticate(stranger);
        assertThrows(AccessDeniedException.class, () -> feedbackService.getFeedbackByGrievance(20L));
        assertThrows(AccessDeniedException.class, () -> feedbackService.getAverageRatingForGrievance(20L));
        verifyNoInteractions(feedback);
    }

    @Test
    void claimRequiresOfficerRoleDepartmentAndUnassignedCase() {
        when(grievances.findByIdForClaim(20L)).thenReturn(Optional.of(grievance));
        assertThrows(AccessDeniedException.class, () -> service.acceptGrievance(20L, owner.getId()));
        grievance.setAssignedOfficer(admin);
        assertThrows(BadRequestException.class, () -> service.acceptGrievance(20L, officer.getId()));
        grievance.setAssignedOfficer(null);
        service.acceptGrievance(20L, officer.getId());
        assertEquals(officer, grievance.getAssignedOfficer());
    }

    @Test
    void officerDirectoryHasNoContactInformation() {
        authenticate(officer);
        officer.setEmail("private@example.test");
        officer.setPhone("private phone");
        when(users.findByRole(Role.OFFICER)).thenReturn(List.of(officer));
        var tree = json.valueToTree(service.getAllOfficers().get(0));
        assertEquals(5, tree.size());
        assertFalse(tree.has("email"));
        assertFalse(tree.has("phone"));
        assertFalse(tree.has("address"));
    }
}