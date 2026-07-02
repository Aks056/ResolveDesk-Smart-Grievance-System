package com.grievance.exception;

/**
 * Exception thrown when request contains invalid data or violates business rules.
 * Typically results in HTTP 400 BAD_REQUEST response.
 */
public class BadRequestException extends RuntimeException {

    private final String errorCode;

    public BadRequestException(String message) {
        super(message);
        this.errorCode = "BAD_REQUEST";
    }

    public BadRequestException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "BAD_REQUEST";
    }

    public String getErrorCode() {
        return errorCode;
    }
}
