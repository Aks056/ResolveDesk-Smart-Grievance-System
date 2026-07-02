package com.grievance.service;

import com.grievance.dto.request.ChangePasswordRequest;
import com.grievance.dto.request.ProfileUpdateRequest;
import com.grievance.dto.request.RegisterRequest;
import com.grievance.dto.response.UserResponse;
import com.grievance.entity.Department;
import com.grievance.entity.User;
import com.grievance.enums.Role;
import com.grievance.exception.BadRequestException;
import com.grievance.exception.ResourceNotFoundException;
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class UserService {

    private UserRepository userRepository;
    private DepartmentRepository departmentRepository;
    private PasswordEncoder passwordEncoder;
    private ModelMapper modelMapper;
    private EmailService emailService;

    // ✅ REGISTER USER (FIXED)
    public UserResponse registerUser(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        // Check duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }

        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhoneNumber()) // ✅ FIXED
                .address(request.getAddress())
                .role(Role.USER)
                .isActive(true)
                .build();

        // Save user
        User savedUser = userRepository.save(user);

        // Send welcome email
        emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFullName());

        return convertToResponse(savedUser);
    }

    // ✅ GET USER PROFILE
    @Transactional(readOnly = true)
    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return convertToResponse(user);
    }

    // ✅ UPDATE USER PROFILE (FIXED)
    public UserResponse updateUserProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check email uniqueness
        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Update fields
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhoneNumber());
        user.setAddress(request.getAddress());

        log.info("Profile updated for user: {}", user.getUsername());
        return convertToResponse(userRepository.save(user));
    }

    // ✅ CHANGE PASSWORD
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid old password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getUsername());
    }

    // ✅ GET USER BY USERNAME
    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return convertToResponse(user);
    }

    // ✅ GET ALL USERS
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::convertToResponse);
    }

    // ✅ GET USERS BY ROLE
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // ✅ GET AVAILABLE OFFICERS
    @Transactional(readOnly = true)
    public List<UserResponse> getAvailableOfficers(Long departmentId) {
        return userRepository.findActiveOfficersByDepartment(departmentId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // ✅ TOGGLE USER ACTIVE
    public UserResponse toggleUserActive(Long userId, Boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setIsActive(isActive);
        return convertToResponse(userRepository.save(user));
    }

    // ✅ ASSIGN DEPARTMENT
    public UserResponse assignDepartment(Long userId, Long departmentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", departmentId));

        user.setDepartment(department);
        user.setRole(Role.OFFICER);

        return convertToResponse(userRepository.save(user));
    }

    // ✅ CHANGE USER ROLE
    public UserResponse changeUserRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setRole(role);

        return convertToResponse(userRepository.save(user));
    }

    // ✅ DELETE USER
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        userRepository.delete(user);
    }

    // ✅ CHECK USERNAME EXISTS
    @Transactional(readOnly = true)
    public boolean isUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    // ✅ CHECK EMAIL EXISTS
    @Transactional(readOnly = true)
    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    // ✅ COUNT USERS
    @Transactional(readOnly = true)
    public long countUsers() {
        return userRepository.count();
    }

    // ✅ CONVERT ENTITY → RESPONSE DTO
    private UserResponse convertToResponse(User user) {
        UserResponse response = modelMapper.map(user, UserResponse.class);

        if (user.getDepartment() != null) {
            response.setDepartmentName(user.getDepartment().getName());
        }

        return response;
    }
}