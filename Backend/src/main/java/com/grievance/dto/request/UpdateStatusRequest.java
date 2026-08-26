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

    @Size(max = 1000, message = "Resolution remarks must not exceed 1000 characters")
    private String resolutionRemarks;

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters")
    private String remarks;

    public String getEffectiveRemarks() {
        if (resolutionRemarks != null && !resolutionRemarks.trim().isEmpty()) {
            return resolutionRemarks.trim();
        }
        return remarks != null ? remarks.trim() : "";
    }
}
