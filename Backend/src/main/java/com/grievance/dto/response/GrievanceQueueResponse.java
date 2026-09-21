package com.grievance.dto.response;

import java.time.LocalDateTime;

import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.Priority;

public record GrievanceQueueResponse(Long id, String title, Long departmentId, String departmentName,
        GrievanceStatus status, Priority priority, LocalDateTime createdAt, boolean privateDetailsAvailable) {
}