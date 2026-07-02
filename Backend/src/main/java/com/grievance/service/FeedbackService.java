package com.grievance.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.grievance.dto.request.FeedbackRequest;
import com.grievance.entity.Feedback;
import com.grievance.entity.Grievance;
import com.grievance.entity.User;
import com.grievance.exception.BadRequestException;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.repository.FeedbackRepository;
import com.grievance.repository.GrievanceRepository;
import com.grievance.repository.UserRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class FeedbackService {

    private FeedbackRepository feedbackRepository;
    private GrievanceRepository grievanceRepository;
    private UserRepository userRepository;

    public Feedback submitFeedback(Long userId, FeedbackRequest request) {
        log.info("Submitting feedback for grievance: {} by user: {}", request.getGrievanceId(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Grievance grievance = grievanceRepository.findById(request.getGrievanceId())
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", request.getGrievanceId()));

        if (!grievance.getCitizen().getId().equals(userId)) {
            throw new BadRequestException("Only grievance citizen can provide feedback");
        }

        if (feedbackRepository.existsForGrievance(grievance)) {
            throw new BadRequestException("Feedback already provided for this grievance");
        }

        Feedback feedback = Feedback.builder()
                .grievance(grievance)
                .user(user)
                .rating(request.getRating())
                .comments(request.getComments())
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        log.info("Feedback submitted for grievance: {}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Feedback> getFeedbackByGrievance(Long grievanceId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

        return feedbackRepository.findByGrievanceOrderByCreatedAtDesc(grievance);
    }

    @Transactional(readOnly = true)
    public List<Feedback> getUserFeedback(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return feedbackRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public Double getAverageRatingForGrievance(Long grievanceId) {
        Grievance grievance = grievanceRepository.findById(grievanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Grievance", "id", grievanceId));

        return feedbackRepository.getAverageRatingForGrievance(grievance);
    }

    @Transactional(readOnly = true)
    public Double getAverageRatingByDepartment(Long departmentId) {
        return feedbackRepository.getAverageRatingByDepartment(departmentId);
    }

    @Transactional(readOnly = true)
    public long getRatingCount(Integer rating) {
        return feedbackRepository.countByRating(rating);
    }

    public void deleteFeedback(Long feedbackId, Long userId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", feedbackId));

        if (!feedback.getUser().getId().equals(userId)) {
            throw new BadRequestException("Only feedback creator can delete feedback");
        }

        feedbackRepository.delete(feedback);
    }
}
