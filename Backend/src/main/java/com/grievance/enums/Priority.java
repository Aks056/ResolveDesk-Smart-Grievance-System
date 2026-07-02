package com.grievance.enums;

/**
 * Enum representing the priority level of a grievance.
 * 
 * LOW: Can be resolved within 30 days
 * MEDIUM: Should be resolved within 15 days  
 * HIGH: Should be resolved within 7 days
 */
public enum Priority {
    LOW("Low Priority - 30 days", 30),
    MEDIUM("Medium Priority - 15 days", 15),
    HIGH("High Priority - 7 days", 7);

    private final String description;
    private final int resolutionDays;

    Priority(String description, int resolutionDays) {
        this.description = description;
        this.resolutionDays = resolutionDays;
    }

    public String getDescription() {
        return description;
    }

    public int getResolutionDays() {
        return resolutionDays;
    }
}
