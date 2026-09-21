package com.grievance.service;

import java.util.Objects;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.grievance.entity.Grievance;
import com.grievance.entity.User;
import com.grievance.enums.Role;
import com.grievance.repository.UserRepository;
import com.grievance.security.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class GrievanceAccessPolicy {
    private final UserRepository userRepository;

    public User requester(Long requesterId) {
        if (requesterId == null) throw new AccessDeniedException("Authentication required");
        return userRepository.findById(requesterId)
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()) && user.getRole() != null)
                .orElseThrow(() -> new AccessDeniedException("Unknown or inactive requester"));
    }

    public User currentRequester() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            throw new AccessDeniedException("Authentication required");
        }
        return requester(details.getUserId());
    }

    public boolean sameDepartment(Grievance grievance, User user) {
        return user.getDepartment() != null && grievance.getDepartment() != null
                && user.getDepartment().getId() != null
                && Objects.equals(user.getDepartment().getId(), grievance.getDepartment().getId());
    }

    public boolean canRead(Grievance grievance, User user) {
        return user != null && user.getId() != null && Boolean.TRUE.equals(user.getIsActive())
                && (user.getRole() == Role.ADMIN
                || (user.getRole() == Role.USER && grievance.getCitizen() != null
                    && Objects.equals(user.getId(), grievance.getCitizen().getId()))
                || (user.getRole() == Role.OFFICER && sameDepartment(grievance, user)
                    && grievance.getAssignedOfficer() != null
                    && Objects.equals(user.getId(), grievance.getAssignedOfficer().getId())));
    }

    public void requireRead(Grievance grievance, User user) {
        if (!canRead(grievance, user)) throw new AccessDeniedException("No access to this grievance");
    }

    public void requireStaff(Grievance grievance, User user) {
        requireRead(grievance, user);
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.OFFICER)
            throw new AccessDeniedException("Staff access required");
    }

    public void requireAdmin(User user) {
        if (user.getRole() != Role.ADMIN) throw new AccessDeniedException("Administrator access required");
    }
}