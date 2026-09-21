package com.grievance.dto.response;

import java.time.LocalDate;

import com.grievance.enums.GrievanceStatus;

public record PublicGrievanceResponse(String publicId, String publicTitle, String publicSummary,
        String departmentName, GrievanceStatus status, LocalDate createdDate,
        int upvoteCount, boolean hasUpvoted) {
}