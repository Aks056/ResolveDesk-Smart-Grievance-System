package com.grievance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO representing feedback details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackResponse {
    private Long id;
    private Long grievanceId;
    private Long userId;
    private String userName;
    private Integer rating;
    private String comments;
    private LocalDateTime createdAt;
}
