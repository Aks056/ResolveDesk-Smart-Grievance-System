package com.grievance.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.grievance.entity.Department;
import com.grievance.entity.User;
import com.grievance.enums.Role;
import com.grievance.repository.DepartmentRepository;
import com.grievance.repository.UserRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Automatically seeds default ADMIN, demo Department, and demo OFFICER on startup.
 */
@Slf4j
@Component
@AllArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Remove legacy 'admin' account if present
        userRepository.findByUsername("admin").ifPresent(adminUser -> {
            try {
                userRepository.delete(adminUser);
                log.info("🗑️ Removed legacy 'admin' account.");
            } catch (Exception e) {
                adminUser.setIsActive(false);
                userRepository.save(adminUser);
                log.info("⚠️ Deactivated legacy 'admin' account due to linked records.");
            }
        });

        // Ensure default department exists
        Department defaultDept = departmentRepository.findByName("Public Works").orElseGet(() -> {
            Department dept = Department.builder()
                    .name("Public Works")
                    .description("Department for civic roads, lighting, sanitation and infrastructure")
                    .contactEmail("works@grievance.com")
                    .isActive(true)
                    .build();
            Department saved = departmentRepository.save(dept);
            log.info("✅ Created default 'Public Works' department.");
            return saved;
        });

        // Ensure admin12 exists and password is admin1234
        userRepository.findByUsername("admin12").ifPresentOrElse(
            user -> {
                user.setRole(Role.ADMIN);
                user.setIsActive(true);
                user.setPasswordHash(passwordEncoder.encode("admin1234"));
                userRepository.save(user);
                log.info("✅ Verified admin12 account (username: admin12, password: admin1234)");
            },
            () -> {
                User newAdmin12 = User.builder()
                        .username("admin12")
                        .email("admin12@grievance.com")
                        .passwordHash(passwordEncoder.encode("admin1234"))
                        .firstName("Admin")
                        .lastName("12")
                        .phone("9999999998")
                        .role(Role.ADMIN)
                        .isActive(true)
                        .build();
                userRepository.save(newAdmin12);
                log.info("✅ Created admin12 account: username: admin12, password: admin1234");
            }
        );

        // Ensure demo officer exists (username: officer1, password: officer1234)
        userRepository.findByUsername("officer1").ifPresentOrElse(
            officer -> {
                officer.setRole(Role.OFFICER);
                officer.setIsActive(true);
                officer.setPasswordHash(passwordEncoder.encode("officer1234"));
                if (officer.getDepartment() == null) {
                    officer.setDepartment(defaultDept);
                }
                userRepository.save(officer);
                log.info("✅ Verified and reset password for officer1 account assigned to {}", defaultDept.getName());
            },
            () -> {
                User newOfficer = User.builder()
                        .username("officer1")
                        .email("officer1@grievance.com")
                        .passwordHash(passwordEncoder.encode("officer1234"))
                        .firstName("Nodal")
                        .lastName("Officer")
                        .phone("9876543210")
                        .role(Role.OFFICER)
                        .department(defaultDept)
                        .isActive(true)
                        .build();
                userRepository.save(newOfficer);
                log.info("✅ Created officer1 account (username: officer1, password: officer1234) for {}", defaultDept.getName());
            }
        );
    }
}
