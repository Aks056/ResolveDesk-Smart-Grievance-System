package com.grievance.enums;

/**
 * Enum representing the status of a grievance throughout its lifecycle.
 * 
 * PENDING: Grievance submitted but not yet assigned
 * IN_PROGRESS: Grievance assigned to officer and being processed
 * RESOLVED: Grievance has been resolved
 * REJECTED: Grievance has been rejected
 */
public enum GrievanceStatus {
    PENDING("Pending - Not yet assigned"),
    ASSIGNED("Assigned - Waiting for officer to accept"),
    IN_PROGRESS("In Progress - Being processed"),
    RESOLVED("Resolved - Issue fixed"),
    REJECTED("Rejected - Cannot be resolved"),
    CLOSED_BY_USER("Closed by User - User closed the grievance");

    private final String description;

    GrievanceStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
