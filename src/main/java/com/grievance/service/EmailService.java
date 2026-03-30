package com.grievance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.mail.fromName}")
    private String mailFromName;

    @Async
    public void sendWelcomeEmail(String recipientEmail, String fullName) {
        log.info("Sending welcome email to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipientEmail);
            message.setSubject("Welcome to Smart Grievance Redressal System");

            String content = String.format(
                    "Dear %s,\n\n" +
                    "Welcome to Smart Grievance Redressal System!\n\n" +
                    "You have successfully registered with us. You can now:\n" +
                    "- Submit grievances\n" +
                    "- Track their status\n" +
                    "- Provide feedback\n\n" +
                    "Best regards,\n" +
                    "Smart Grievance System Team",
                    fullName
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Welcome email sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Error sending welcome email to: {}", recipientEmail, e);
        }
    }

    @Async
    public void sendGrievanceSubmittedEmail(String recipientEmail, String grievanceNumber) {
        log.info("Sending grievance submitted confirmation to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipientEmail);
            message.setSubject("Grievance Submitted - " + grievanceNumber);

            String content = String.format(
                    "Your grievance has been successfully submitted.\n\n" +
                    "Grievance Number: %s\n" +
                    "You can track this grievance using the web portal.\n\n" +
                    "Thank you,\n" +
                    "Smart Grievance System Team",
                    grievanceNumber
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Grievance submission email sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Error sending grievance submission email to: {}", recipientEmail, e);
        }
    }

    @Async
    public void sendStatusUpdateEmail(String recipientEmail, String grievanceNumber, String newStatus) {
        log.info("Sending status update email to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipientEmail);
            message.setSubject("Grievance Status Updated - " + grievanceNumber);

            String content = String.format(
                    "Your grievance status has been updated.\n\n" +
                    "Grievance Number: %s\n" +
                    "New Status: %s\n\n" +
                    "Please check the portal for more details.\n\n" +
                    "Best regards,\n" +
                    "Smart Grievance System Team",
                    grievanceNumber, newStatus
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Status update email sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Error sending status update email to: {}", recipientEmail, e);
        }
    }

    @Async
    public void sendAssignmentEmail(String recipientEmail, String grievanceNumber) {
        log.info("Sending grievance assignment notification to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipientEmail);
            message.setSubject("Grievance Assigned to You - " + grievanceNumber);

            String content = String.format(
                    "A new grievance has been assigned to you.\n\n" +
                    "Grievance Number: %s\n" +
                    "Please log in to the portal to view and process this grievance.\n\n" +
                    "Best regards,\n" +
                    "Smart Grievance System Team",
                    grievanceNumber
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Assignment notification sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Error sending assignment email to: {}", recipientEmail, e);
        }
    }

    @Async
    public void sendResolutionEmail(String recipientEmail, String grievanceNumber) {
        log.info("Sending resolution notification to: {}", recipientEmail);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipientEmail);
            message.setSubject("Your Grievance Has Been Resolved - " + grievanceNumber);

            String content = String.format(
                    "Your grievance has been marked as resolved.\n\n" +
                    "Grievance Number: %s\n" +
                    "You can now provide feedback on your experience.\n\n" +
                    "Best regards,\n" +
                    "Smart Grievance System Team",
                    grievanceNumber
            );

            message.setText(content);
            mailSender.send(message);
            log.info("Resolution notification sent to: {}", recipientEmail);
        } catch (Exception e) {
            log.error("Error sending resolution email to: {}", recipientEmail, e);
        }
    }
}


