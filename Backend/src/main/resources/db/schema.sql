-- Smart Grievance Redressal System Database Schema

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    role ENUM('USER', 'ADMIN', 'OFFICER') NOT NULL DEFAULT 'USER',
    department_id BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    contact_email VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Grievances Table
CREATE TABLE IF NOT EXISTS grievances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    grievance_number VARCHAR(20) NOT NULL UNIQUE,
    citizen_id BIGINT NOT NULL,
    assigned_officer_id BIGINT,
    department_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    attachment_url VARCHAR(500),
    status ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    resolution_days INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_grievance_number (grievance_number),
    INDEX idx_citizen_id (citizen_id),
    INDEX idx_status (status),
    INDEX idx_department_id (department_id),
    FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Grievance History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS grievance_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    grievance_id BIGINT NOT NULL,
    old_status ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'),
    new_status ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED') NOT NULL,
    remarks TEXT,
    updated_by_user_id BIGINT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_grievance_id (grievance_id),
    INDEX idx_updated_by_user_id (updated_by_user_id),
    FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    grievance_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_grievance_id (grievance_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_grievance_user (grievance_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id, role);
CREATE INDEX idx_grievances_priority ON grievances(priority);
CREATE INDEX idx_grievances_created_at ON grievances(created_at DESC);

-- Sample Departments (Optional - can be added via Admin UI)
INSERT INTO departments (name, description, contact_email, is_active) VALUES
('Public Works', 'Department for roads, bridges, and public infrastructure', 'works@govt.com', true),
('Water Supply', 'Department for water management and supply', 'water@govt.com', true),
('Electricity', 'Department for power distribution and utilities', 'electricity@govt.com', true),
('Health', 'Department for healthcare and medical services', 'health@govt.com', true),
('Education', 'Department for educational institutions', 'education@govt.com', true)
ON DUPLICATE KEY UPDATE name = name;

-- Sample Admin User (password: admin@123)
-- You should change this in production!
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role, is_active)
SELECT 'admin', 'admin@grievance.com', '$2a$10$dXj3SW6G7P50eS3UQ3OO2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUm', 'System', 'Admin', '9999999999', 'ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
LIMIT 1;
