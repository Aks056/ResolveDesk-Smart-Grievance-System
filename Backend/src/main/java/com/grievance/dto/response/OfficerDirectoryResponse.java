package com.grievance.dto.response;

public record OfficerDirectoryResponse(Long id, String firstName, String lastName,
        Long departmentId, String departmentName) {
}