package com.grievance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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
    private String updatedBy;
    private LocalDateTime updatedAt;
}
