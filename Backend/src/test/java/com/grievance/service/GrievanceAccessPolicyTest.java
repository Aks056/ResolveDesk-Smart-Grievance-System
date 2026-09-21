package com.grievance.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import com.grievance.entity.Department;
import com.grievance.entity.Grievance;
import com.grievance.entity.User;
import com.grievance.enums.Role;
import com.grievance.repository.UserRepository;

class GrievanceAccessPolicyTest {
    private final GrievanceAccessPolicy policy = new GrievanceAccessPolicy(mock(UserRepository.class));

    @Test
    void roleOwnershipDepartmentAndReassignmentMatrix() {
        Department department = Department.builder().id(1L).build();
        User owner = User.builder().id(1L).role(Role.USER).build();
        User officer = User.builder().id(2L).role(Role.OFFICER).department(department).build();
        Grievance grievance = Grievance.builder().citizen(owner).department(department).assignedOfficer(officer).build();
        assertTrue(policy.canRead(grievance, owner));
        assertTrue(policy.canRead(grievance, officer));
        assertTrue(policy.canRead(grievance, User.builder().id(3L).role(Role.ADMIN).build()));
        assertFalse(policy.canRead(grievance, User.builder().id(4L).role(Role.USER).build()));
        assertFalse(policy.canRead(grievance, User.builder().id(5L).role(Role.OFFICER).department(department).build()));
        officer.setDepartment(Department.builder().id(2L).build());
        assertFalse(policy.canRead(grievance, officer));
        officer.setDepartment(department);
        grievance.setAssignedOfficer(User.builder().id(6L).role(Role.OFFICER).department(department).build());
        assertFalse(policy.canRead(grievance, officer));
        assertFalse(policy.canRead(grievance, null));
        assertFalse(policy.canRead(grievance, User.builder().id(1L).build()));
        assertThrows(AccessDeniedException.class, () -> policy.requireStaff(grievance, owner));
        assertThrows(AccessDeniedException.class, () -> policy.requester(999L));
    }
}