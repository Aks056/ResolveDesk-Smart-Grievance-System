package com.grievance.dto.response;

import com.grievance.enums.GrievanceStatus;
import com.grievance.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO for grievance response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrievanceResponse {

    private Long id;
    private String grievanceNumber;
    private String title;
    private String description;
    private String attachmentUrl;
    private String imageUrl;
    private GrievanceStatus status;
    private Priority priority;
    private Integer resolutionDays;
    
    // Citizen info
    private Long citizenId;
    private String citizenName;
    
    // Officer info (if assigned)
    private Long assignedOfficerId;
    private String assignedOfficerName;
    
    // Department info
    private Long departmentId;
    private String departmentName;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double averageRating;
}
