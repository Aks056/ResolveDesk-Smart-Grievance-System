package com.grievance.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import com.grievance.dto.response.PublicGrievanceResponse;
import com.grievance.dto.response.UpvoteResponse;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.Role;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.security.CustomUserDetails;
import com.grievance.security.JwtTokenProvider;
import com.grievance.security.SecurityConfig;
import com.grievance.service.DepartmentService;
import com.grievance.service.GrievanceService;

import jakarta.persistence.OptimisticLockException;

@WebMvcTest(controllers = GrievanceController.class,
        properties = "spring.config.location=optional:classpath:/privacy-tests.properties")
@Import(SecurityConfig.class)
class GrievancePrivacyMvcTest {
    @Autowired private MockMvc mvc;
    @MockBean private GrievanceService service;
    @MockBean private DepartmentService departments;
    @MockBean private JwtTokenProvider tokens;
    @MockBean private UserDetailsService users;

    private CustomUserDetails principal(Role role) {
        return new CustomUserDetails(User.builder().id(1L).role(role).username("privacy-test").build());
    }

    @Test
    void anonymousFeedAndLegacyUploadsAreDenied() throws Exception {
        mvc.perform(get("/api/grievances/all")).andExpect(status().isUnauthorized());
        mvc.perform(get("/uploads/legacy.txt")).andExpect(status().isUnauthorized());
        mvc.perform(get("/uploads/legacy.txt").with(user(principal(Role.ADMIN)))).andExpect(status().isForbidden());
        verifyNoInteractions(service);
    }

    @Test
    void rootListAndPublicationAreAdminOnly() throws Exception {
        mvc.perform(get("/api/grievances").with(user(principal(Role.OFFICER)))).andExpect(status().isForbidden());
        mvc.perform(put("/api/grievances/20/publication").with(user(principal(Role.OFFICER)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"published\":true,\"publicTitle\":\"Reviewed\",\"publicSummary\":\"Reviewed summary\"}"))
                .andExpect(status().isForbidden());
        when(service.getAllGrievances(any())).thenReturn(new PageImpl<>(List.of()));
        mvc.perform(get("/api/grievances").with(user(principal(Role.ADMIN)))).andExpect(status().isOk());
    }

    @Test
    void feedAndPublicDetailContainOnlyReviewedSummary() throws Exception {
        var summary = new PublicGrievanceResponse("8a83d5ed-732b-4c64-a3ca-67f94f4f6c9f", "Reviewed", "Safe summary", "Water",
                GrievanceStatus.PENDING, LocalDate.of(2026, 9, 21), 2, false);
        when(service.getGlobalGrievances(eq(1L), any())).thenReturn(new PageImpl<>(List.of(summary)));
        when(service.getPublicGrievance(eq(summary.publicId()), eq(1L))).thenReturn(summary);
        mvc.perform(get("/api/grievances/all?size=500").with(user(principal(Role.USER))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].publicTitle").value("Reviewed"))
                .andExpect(jsonPath("$.content[0].id").doesNotExist())
                .andExpect(jsonPath("$.content[0].description").doesNotExist())
                .andExpect(jsonPath("$.content[0].attachmentUrl").doesNotExist());
        mvc.perform(get("/api/grievances/public/" + summary.publicId()).with(user(principal(Role.USER))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.publicSummary").value("Safe summary"))
                .andExpect(jsonPath("$.citizenId").doesNotExist());
        mvc.perform(get("/api/grievances/all?size=0").with(user(principal(Role.USER)))).andExpect(status().isBadRequest());
    }

    @Test
    void bothVoteRoutesReturnOnlyVoteStateAndPrivateVotesReturnNotFound() throws Exception {
        when(service.toggleUpvote(20L, 1L)).thenReturn(new UpvoteResponse(2, true));
        when(service.togglePublicUpvote("public-key", 1L)).thenReturn(new UpvoteResponse(2, true));
        for (String path : List.of("/api/grievances/20/upvote", "/api/grievances/public/public-key/upvote")) {
            mvc.perform(post(path).with(user(principal(Role.USER))))
                    .andExpect(status().isOk()).andExpect(content().json("{\"upvoteCount\":2,\"hasUpvoted\":true}", true));
        }
        when(service.toggleUpvote(21L, 1L)).thenThrow(new ResourceNotFoundException("Published grievance unavailable"));
        mvc.perform(post("/api/grievances/21/upvote").with(user(principal(Role.USER)))).andExpect(status().isNotFound());
    }

    @Test
    void evidenceIsAuthorizedAndHasSafeDownloadHeaders() throws Exception {
        when(service.getEvidence(20L, 1L)).thenReturn(new ByteArrayResource("evidence".getBytes()));
        mvc.perform(get("/api/grievances/20/attachments/evidence").with(user(principal(Role.USER))))
                .andExpect(status().isOk()).andExpect(content().string("evidence"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"evidence\""))
                .andExpect(header().string("Cache-Control", "private, no-store"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM));
        when(service.getEvidence(21L, 1L)).thenThrow(new AccessDeniedException("No access"));
        mvc.perform(get("/api/grievances/21/attachments/evidence").with(user(principal(Role.USER)))).andExpect(status().isForbidden());
        mvc.perform(get("/api/grievances/20/attachments/evidence")).andExpect(status().isUnauthorized());
    }

    @Test
    void forbiddenPrivatePathsReturn403AndPublicationValidatesBounds() throws Exception {
        when(service.getGrievanceDetails(20L, 1L)).thenThrow(new AccessDeniedException("No access"));
        when(service.getGrievanceHistory(20L)).thenThrow(new AccessDeniedException("No access"));
        mvc.perform(get("/api/grievances/20").with(user(principal(Role.USER)))).andExpect(status().isForbidden());
        mvc.perform(get("/api/grievances/20/history").with(user(principal(Role.USER)))).andExpect(status().isForbidden());
        mvc.perform(put("/api/grievances/20/priority?priority=HIGH").with(user(principal(Role.USER)))).andExpect(status().isForbidden());
        mvc.perform(put("/api/grievances/20/publication").with(user(principal(Role.ADMIN)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"published\":true,\"publicTitle\":\"" + "x".repeat(201) + "\",\"publicSummary\":\"Summary\"}"))
                .andExpect(status().isBadRequest());
    }

    static Stream<RuntimeException> optimisticConflicts() {
        return Stream.of(
                new OptimisticLockException("update grievances set description='PRIVATE SQL' where id=20"),
                new ObjectOptimisticLockingFailureException("Sensitive entity and SQL details",
                        new OptimisticLockException("PRIVATE SQL")));
    }

    @ParameterizedTest
    @MethodSource("optimisticConflicts")
    void publicationConflictReturnsSafe409WithoutSuccessBody(RuntimeException conflict) throws Exception {
        when(service.updatePublication(eq(20L), eq(1L), any())).thenThrow(conflict);
        mvc.perform(put("/api/grievances/20/publication").with(user(principal(Role.ADMIN)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"published\":false}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("The record was changed by another request. Reload it and try again."))
                .andExpect(jsonPath("$.published").doesNotExist())
                .andExpect(jsonPath("$.description").doesNotExist())
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("PRIVATE SQL"))))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Sensitive entity"))));
    }
}