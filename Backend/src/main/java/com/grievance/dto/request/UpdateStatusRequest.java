package com.grievance.dto.request;

import com.grievance.enums.GrievanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating grievance status (Officer only).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private GrievanceStatus status;

    @Size(max = 500, message = "Remarks must not exceed 500 characters")
    private String remarks;
}
