package com.grievance.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import com.grievance.dto.response.GrievanceResponse;
import com.grievance.entity.User;
import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.Role;
import com.grievance.repository.GrievanceRepository;
import com.grievance.security.CustomUserDetails;
import com.grievance.security.JwtTokenProvider;
import com.grievance.security.SecurityConfig;
import com.grievance.service.DepartmentService;
import com.grievance.service.GrievanceService;
import com.grievance.service.UserService;

@WebMvcTest(controllers = AdminController.class,
        properties = "spring.config.location=optional:classpath:/privacy-tests.properties")
@Import(SecurityConfig.class)
class AdminReopenMvcTest {
    @Autowired private MockMvc mvc;
    @MockBean private GrievanceService service;
    @MockBean private DepartmentService departments;
    @MockBean private GrievanceRepository grievances;
    @MockBean private UserService users;
    @MockBean private JwtTokenProvider tokens;
    @MockBean private UserDetailsService userDetails;

    private CustomUserDetails principal(Role role) {
        return new CustomUserDetails(User.builder().id(1L).role(role).username("reopen-test").build());
    }

    @Test
    void reopenRejectsBlankMissingAndShortRemarksWithFieldErrors() throws Exception {
        mvc.perform(post("/api/admin/grievances/20/reopen").with(user(principal(Role.ADMIN)))
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("remarks"))
                .andExpect(jsonPath("$.fieldErrors[0].message").value("A reason for reopening is required"));
        mvc.perform(post("/api/admin/grievances/20/reopen").with(user(principal(Role.ADMIN)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"remarks\":\"   \"}"))
                .andExpect(status().isBadRequest())
                // Whitespace violates both constraints and their fieldErrors order is not guaranteed.
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("remarks"));
        mvc.perform(post("/api/admin/grievances/20/reopen").with(user(principal(Role.ADMIN)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"remarks\":\"too short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].message").value("Reason must be between 10 and 1000 characters"));
        verifyNoInteractions(service);
    }

    @Test
    void reopenEndpointIsAdminOnly() throws Exception {
        mvc.perform(post("/api/admin/grievances/20/reopen").with(user(principal(Role.OFFICER)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"remarks\":\"Rejection missed the inspection evidence\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/grievances/20/reopen")
                .contentType(MediaType.APPLICATION_JSON).content("{\"remarks\":\"Rejection missed the inspection evidence\"}"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void reopenReturnsUpdatedGrievanceForAdmin() throws Exception {
        GrievanceResponse reopened = GrievanceResponse.builder().id(20L).grievanceNumber("GRV-TEST0001")
                .status(GrievanceStatus.PENDING).build();
        when(service.reopenGrievance(eq(20L), eq(1L), eq("Rejection missed the on-site inspection evidence")))
                .thenReturn(reopened);
        mvc.perform(post("/api/admin/grievances/20/reopen").with(user(principal(Role.ADMIN)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"remarks\":\"Rejection missed the on-site inspection evidence\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.grievanceNumber").value("GRV-TEST0001"));
    }
}
