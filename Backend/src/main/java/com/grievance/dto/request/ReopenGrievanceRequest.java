package com.grievance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for reopening a rejected grievance (Admin only).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReopenGrievanceRequest {

    @NotBlank(message = "A reason for reopening is required")
    @Size(min = 10, max = 1000, message = "Reason must be between 10 and 1000 characters")
    private String remarks;
}
