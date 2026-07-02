package com.grievance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

/**
 * DTO for dashboard statistics response (role-aware).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    // Common statistics
    private long totalGrievances;
    private long pendingGrievances;
    private long assignedGrievances;
    private long inProgressGrievances;
    private long resolvedGrievances;
    private long rejectedGrievances;
    private long closedByUserGrievances;
    
    // User-specific stats
    private long myGrievances;
    private double myAverageRating;
    
    // Officer-specific stats
    private long assignedToMe;
    private long resolvedByMe;
    
    // Admin statistics
    private long totalUsers;
    private long totalDepartments;
    private double overallAverageResolutionTime;
    
    // Department-wise breakdown
    private Map<String, DepartmentStats> departmentStats;
    
    // Time-based trends
    private Map<String, Long> dailyTrends;
    private Map<String, Long> weeklyTrends;
    private Map<String, Long> monthlyTrends;

    /**
     * Nested class for department statistics
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentStats {
        private Long departmentId;
        private String departmentName;
        private long grievanceCount;
        private long resolvedCount;
        private double averageRating;
        private double averageResolutionTime;
    }
}
