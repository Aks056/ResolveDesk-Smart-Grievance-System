package com.grievance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for dispatching email notifications.
 * Automatically mocks/simulates email delivery in development mode when placeholder SMTP credentials are detected.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:admin@grievance-system.com}")
    private String mailFrom;

    @Value("${app.mail.fromName:Smart Grievance System}")
    private String mailFromName;

    /**
     * Checks whether real SMTP credentials are configured.
     */
    private boolean isSmtpConfigured() {
        return mailUsername != null 
                && !mailUsername.isBlank() 
                && !mailUsername.contains("your-email") 
                && !mailUsername.equals("your-email@gmail.com")
                && mailPassword != null 
                && !mailPassword.isBlank() 
                && !mailPassword.equals("your-app-password");
    }

    private void dispatchEmail(String recipientEmail, String subject, String content) {
        if (!isSmtpConfigured() || recipientEmail == null || recipientEmail.endsWith("@email.com") || recipientEmail.endsWith("@example.com")) {
            log.info("📧 [Dev Email Mock] To: <{}> | Subject: \"{}\" (Simulated - configure real SMTP in application.properties to send live emails)", recipientEmail, subject);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("✅ Live email successfully dispatched to: {}", recipientEmail);
        } catch (Exception e) {
            log.warn("⚠️ SMTP Dispatch skipped/failed for <{}>: {} (Check credentials in application.properties)", recipientEmail, e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String recipientEmail, String fullName) {
        String subject = "Welcome to Smart Grievance Redressal System";
        String content = String.format(
                "Dear %s,\n\n" +
                "Welcome to Smart Grievance Redressal System!\n\n" +
                "You have successfully registered. You can now:\n" +
                "- Submit grievances\n" +
                "- Track real-time progress\n" +
                "- Provide post-resolution feedback\n\n" +
                "Best regards,\n" +
                "Smart Grievance System Team",
                fullName != null ? fullName : "Citizen"
        );
        dispatchEmail(recipientEmail, subject, content);
    }

    @Async
    public void sendGrievanceSubmittedEmail(String recipientEmail, String grievanceNumber) {
        String subject = "Grievance Submitted - " + grievanceNumber;
        String content = String.format(
                "Your grievance has been successfully submitted.\n\n" +
                "Grievance Tracking Number: %s\n" +
                "You can track the progress anytime via the portal dashboard.\n\n" +
                "Thank you,\n" +
                "Smart Grievance System Team",
                grievanceNumber
        );
        dispatchEmail(recipientEmail, subject, content);
    }

    @Async
    public void sendStatusUpdateEmail(String recipientEmail, String grievanceNumber, String newStatus) {
        String subject = "Grievance Status Updated - " + grievanceNumber;
        String content = String.format(
                "Your grievance status has been updated.\n\n" +
                "Grievance Number: %s\n" +
                "New Status: %s\n\n" +
                "Please log in to the portal for complete resolution notes.\n\n" +
                "Best regards,\n" +
                "Smart Grievance System Team",
                grievanceNumber, newStatus
        );
        dispatchEmail(recipientEmail, subject, content);
    }

    @Async
    public void sendAssignmentEmail(String recipientEmail, String grievanceNumber) {
        String subject = "Grievance Assigned to You - " + grievanceNumber;
        String content = String.format(
                "A new departmental grievance has been assigned to you.\n\n" +
                "Grievance Number: %s\n" +
                "Please log in to the Officer Portal to review and take action.\n\n" +
                "Best regards,\n" +
                "Smart Grievance System Team",
                grievanceNumber
        );
        dispatchEmail(recipientEmail, subject, content);
    }

    @Async
    public void sendResolutionEmail(String recipientEmail, String grievanceNumber) {
        String subject = "Your Grievance Has Been Resolved - " + grievanceNumber;
        String content = String.format(
                "Your grievance has been resolved.\n\n" +
                "Grievance Number: %s\n" +
                "Please log in to review the resolution details and share your feedback rating.\n\n" +
                "Best regards,\n" +
                "Smart Grievance System Team",
                grievanceNumber
        );
        dispatchEmail(recipientEmail, subject, content);
    }
}
