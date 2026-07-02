package com.grievance.exception;

/**
 * Exception thrown when user is not authorized to perform an action.
 * Typically results in HTTP 403 FORBIDDEN response.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
