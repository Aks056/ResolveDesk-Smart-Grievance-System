package com.grievance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Smart Grievance Redressal System - Main Application Entry Point
 * 
 * This is a professional grievance redressal system built with:
 * - Spring Boot 3
 * - Spring Security with JWT Authentication
 * - MySQL Database with JPA/Hibernate
 * - Clean Layered Architecture
 * - Role-based Access Control
 * - Email Notifications
 * - Comprehensive Dashboard
 */
@SpringBootApplication
@EnableAsync
public class SmartGrievanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartGrievanceApplication.class, args);
    }
}
