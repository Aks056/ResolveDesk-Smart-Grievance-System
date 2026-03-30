package com.grievance.security;

import com.grievance.entity.User;
import com.grievance.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom UserDetailsService implementation.
 * Loads user details from database during authentication.
 */
@Slf4j
@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user details for username: {}", username);

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with username: " + username));

        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is disabled: " + username);
        }

        return new CustomUserDetails(user);
    }

    /**
     * Load user by email (alternative method)
     */
    @Transactional
    public UserDetails loadUserByEmail(String email) throws UsernameNotFoundException {
        log.debug("Loading user details for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email));

        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is disabled: " + email);
        }

        return new CustomUserDetails(user);
    }
}
