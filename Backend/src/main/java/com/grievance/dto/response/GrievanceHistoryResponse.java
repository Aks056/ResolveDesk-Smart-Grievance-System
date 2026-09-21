package com.grievance.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for grievance processing history response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceHistoryResponse {
    private Long id;
    private String status;
    private String remarks;
    private com.grievance.enums.HistoryVisibility visibility;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
