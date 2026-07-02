package com.grievance.enums;

/**
 * Enum representing different user roles in the system.
 * 
 * USER: Regular citizen who can submit grievances
 * ADMIN: System administrator who can manage users and departments
 * OFFICER: Officer who can process and resolve grievances
 */
public enum Role {
    USER("User - Can submit and track grievances"),
    ADMIN("Admin - Can manage system"),
    OFFICER("Officer - Can process grievances");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
