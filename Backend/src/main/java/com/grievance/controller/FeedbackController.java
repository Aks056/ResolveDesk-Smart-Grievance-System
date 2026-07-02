package com.grievance.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.dto.request.FeedbackRequest;
import com.grievance.entity.Feedback;
import com.grievance.service.FeedbackService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/feedback")
@AllArgsConstructor
public class FeedbackController {

    private FeedbackService feedbackService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            Authentication authentication) {
        log.info("Submitting feedback for grievance: {}", request.getGrievanceId());

        try {
            Long userId = getUserIdFromAuthentication(authentication);
            Feedback feedback = feedbackService.submitFeedback(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(feedback);
        } catch (Exception e) {
            log.error("Error submitting feedback: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/grievance/{grievanceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getFeedbackByGrievance(@PathVariable Long grievanceId) {
        log.debug("Fetching feedback for grievance: {}", grievanceId);

        try {
            List<Feedback> feedbackList = feedbackService.getFeedbackByGrievance(grievanceId);
            return ResponseEntity.ok(feedbackList);
        } catch (Exception e) {
            log.error("Error fetching feedback: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyFeedback(Authentication authentication) {
        log.debug("Fetching feedback for user: {}", authentication.getName());

        try {
            Long userId = getUserIdFromAuthentication(authentication);
            List<Feedback> feedbackList = feedbackService.getUserFeedback(userId);
            return ResponseEntity.ok(feedbackList);
        } catch (Exception e) {
            log.error("Error fetching user feedback: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/grievance/{grievanceId}/rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAverageRating(@PathVariable Long grievanceId) {
        log.debug("Fetching average rating for grievance: {}", grievanceId);

        try {
            Double avgRating = feedbackService.getAverageRatingForGrievance(grievanceId);
            return ResponseEntity.ok(avgRating != null ? avgRating : 0.0);
        } catch (Exception e) {
            log.error("Error fetching average rating: {}", e.getMessage());
            throw e;
        }
    }

    @DeleteMapping("/{feedbackId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> deleteFeedback(
            @PathVariable Long feedbackId,
            Authentication authentication) {
        log.info("Deleting feedback: {}", feedbackId);

        try {
            Long userId = getUserIdFromAuthentication(authentication);
            feedbackService.deleteFeedback(feedbackId, userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting feedback: {}", e.getMessage());
            throw e;
        }
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        // In a real scenario, extract user ID from token or principal
        return 1L;  // Replace with actual implementation
    }
}
