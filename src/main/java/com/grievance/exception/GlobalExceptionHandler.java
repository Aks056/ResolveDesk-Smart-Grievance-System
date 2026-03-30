package com.grievance.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import java.util.ArrayList;
import java.util.List;

/**
 * Global Exception Handler for all REST endpoints
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // ✅ Resource not found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {

        log.error("Resource not found: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(apiError, HttpStatus.NOT_FOUND);
    }

    // ✅ Bad request
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequestException(
            BadRequestException ex, WebRequest request) {

        log.error("Bad request: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    // ✅ Unauthorized
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorizedException(
            UnauthorizedException ex, WebRequest request) {

        log.error("Unauthorized: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN,
                ex.getMessage(),
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    // ✅ Access denied
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {

        log.error("Access denied: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.FORBIDDEN,
                "You don't have permission to access this resource",
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(apiError, HttpStatus.FORBIDDEN);
    }

    // ✅ Authentication failed
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(
            AuthenticationException ex, WebRequest request) {

        log.error("Authentication failed: {}", ex.getMessage());

        ApiError apiError = new ApiError(
                HttpStatus.UNAUTHORIZED,
                "Authentication failed: " + ex.getMessage(),
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(apiError, HttpStatus.UNAUTHORIZED);
    }

    // 🔥 FIXED: VALIDATION ERRORS (IMPORTANT)
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            org.springframework.http.HttpStatusCode status, // ✅ FIXED
            WebRequest request) {

        List<ApiError.FieldError> fieldErrors = new ArrayList<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            Object rejectedValue = ((FieldError) error).getRejectedValue();

            fieldErrors.add(new ApiError.FieldError(fieldName, errorMessage, rejectedValue));
        });

        ApiError apiError = new ApiError(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                request.getDescription(false).replace("uri=", ""),
                fieldErrors);

        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    // ✅ Catch all
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, WebRequest request) {

        log.error("Unexpected error occurred", ex);

        ApiError apiError = new ApiError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.",
                request.getDescription(false).replace("uri=", ""));

        return new ResponseEntity<>(apiError, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}