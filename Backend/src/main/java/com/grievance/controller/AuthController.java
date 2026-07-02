package com.grievance.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.grievance.dto.request.LoginRequest;
import com.grievance.dto.request.RegisterRequest;
import com.grievance.dto.response.AuthResponse;
import com.grievance.dto.response.UserResponse;
import com.grievance.security.JwtTokenProvider;
import com.grievance.service.UserService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private UserService userService;
    private AuthenticationManager authenticationManager;
    private JwtTokenProvider tokenProvider;

    @PostMapping("/register")
public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

    log.info("User registration request for username: {}", request.getUsername());

    try {
        // 1️⃣ Create user
        UserResponse userResponse = userService.registerUser(request);

        // 2️⃣ Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // 3️⃣ Generate JWT token
        String token = tokenProvider.generateToken(authentication);

        // 4️⃣ Return token + user
        AuthResponse authResponse = AuthResponse.builder()
                .message("Registration successful")
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(userResponse)
                .build();

        return ResponseEntity.ok(authResponse);

    } catch (Exception e) {
        log.error("Registration failed: ", e);
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("User login request for username: {}", request.getUsername());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            String token = tokenProvider.generateToken(authentication);
            UserResponse userResponse = userService.getUserByUsername(request.getUsername());

            AuthResponse authResponse = AuthResponse.builder()
                    .message("Login successful")
                    .token(token)
                    .tokenType("Bearer")
                    .expiresIn(86400000L)  // 24 hours
                    .user(userResponse)
                    .build();

            log.info("User logged in successfully: {}", request.getUsername());
            return ResponseEntity.ok(authResponse);

        } catch (AuthenticationException e) {
            log.error("Authentication failed for user: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        log.info("User logout request");
        return ResponseEntity.ok("Logout successful");
    }
}
