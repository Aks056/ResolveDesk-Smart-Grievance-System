# Smart Grievance System - Backend Documentation

This document provides a comprehensive overview of the backend architecture, technology stack, API endpoints, and logic flow of the Smart Grievance System.

## 1. Technology Stack

The project is built using a modern Java-based stack focused on security, scalability, and maintainability.

*   **Language**: Java 17 (LTS)
*   **Core Framework**: [Spring Boot 3.1.5](https://spring.io/projects/spring-boot)
*   **Security**: [Spring Security](https://spring.io/projects/spring-security) with [stateless JWT (JSON Web Token)](https://jwt.io/) authentication via **JJWT**.
*   **Database**: [MySQL 8.0](https://www.mysql.com/) (Main Database) and [H2](https://www.h2database.com/) (In-memory for testing).
*   **Persistence Layer**: [Spring Data JPA](https://spring.io/projects/spring-data-jpa) (Hibernate).
*   **API Documentation**: [Springdoc OpenAPI 2.0](https://springdoc.org/) (Swagger UI).
*   **Mapping**: [ModelMapper](https://modelmapper.org/) for DTO-to-Entity conversion.
*   **Boilerplate Control**: [Lombok](https://projectlombok.org/) for reducing getter/setter/constructor code.
*   **Templating**: [Thymeleaf](https://www.thymeleaf.org/) (used for traditional view controllers and email templates).

---

## 2. Overall Logic Flow

The backend follows a standard **N-Tier Architecture**:

1.  **Controller Layer**: Handles incoming HTTP requests, validates input using `@Valid`, and delegates business logic to the Service layer.
2.  **Service Layer**: Contains the core business logic. It interacts with multiple repositories and ensures transactional integrity (`@Transactional`).
3.  **Repository Layer**: Communicates with the MySQL database using Spring Data JPA.
4.  **Security Layer**: Intercepts requests to validate JWT tokens. It uses a `JwtAuthenticationFilter` and `CustomUserDetailsService` to populate the `SecurityContext`.

### Data Flow Example (Submitting a Grievance):
1.  **Client** sends a `POST` request to `/api/grievances` with multipart/form-data.
2.  **Spring Security** validates the JWT token in the `Authorization` header.
3.  **GrievanceController** extracts parameters and the file, then calls `grievanceService.submitGrievance(...)`.
4.  **GrievanceService**:
    *   Finds the **User** and **Department**.
    *   Saves the attached file (if any) to the disk/cloud via `FileStorageService`.
    *   Creates a `Grievance` entity and saves it to the **GrievanceRepository**.
    *   Records the creation in the `HistoryTable`.
5.  **Response**: Returns a `GrievanceResponse` DTO to the client.

---

## 3. API Endpoints Reference

### 3.1 Authentication (`/api/auth`)
*Used for identity management and session establishing via JWT.*

| Endpoint | Method | Description | Request Body (POST/PUT) |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register a new user account. | `RegisterRequest` (username, email, password, etc.) |
| `/api/auth/login` | `POST` | Authenticate and get a JWT token. | `LoginRequest` (username, password) |
| `/api/auth/logout` | `POST` | Standard logout (client-side token deletion). | N/A |

### 3.2 Grievance Management (`/api/grievances`)
*Core functionality for reporting and tracking complaints.*

| Endpoint | Method | Description | Request Data |
| :--- | :--- | :--- | :--- |
| `/api/grievances` | `POST` | Submit a new grievance (Multipart). | `title`, `description`, `departmentId`, `priority`, `file` |
| `/api/grievances/my` | `GET` | List all grievances submitted by the current user. | Auth Token |
| `/api/grievances/recent` | `GET` | Fetch top 5 recent grievances for the dashboard. | Auth Token |
| `/api/grievances/{id}` | `GET` | Get full details of a specific grievance. | ID in Path |
| `/api/grievances/assigned` | `GET` | (Officer/Admin) List grievances assigned to the officer. | Auth Token |
| `/api/grievances/{id}/status`| `PUT` | Update status (In Progress, Resolved, Closed). | `UpdateStatusRequest` (status, remarks) |
| `/api/grievances/{id}/accept`| `PUT` | (Officer) Accept a pending grievance assigned to them. | ID in Path |
| `/api/grievances/{id}/history`| `GET` | View the timeline of events for a grievance. | ID in Path |

### 3.3 Dashboard & Statistics (`/api/dashboard`)
*Aggregated data for various roles.*

| Endpoint | Method | Description | Returns |
| :--- | :--- | :--- | :--- |
| `/api/dashboard/user` | `GET` | User-specific counts (Pending, Resolved, Total). | `DashboardResponse` |
| `/api/dashboard/officer`| `GET` | Officer-specific counts (Assigned, In Progress). | `DashboardResponse` |
| `/api/dashboard/admin` | `GET` | Global system-wide counts. | `DashboardResponse` |
| `/api/dashboard/statistics`| `GET` | Detailed breakdown of grievances by status/types. | JSON Map |

### 3.4 Administrative Operations (`/api/admin`)
*System-wide configuration and department oversight.*

| Endpoint | Method | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `/api/admin/departments` | `GET/POST` | List or Create departments. | `Map<String, String>` (name, description, etc.) |
| `/api/admin/departments/{id}`| `PUT/DELETE` | Update or Delete a department. | `Map<String, String>` |
| `/api/admin/grievances/{gid}/assign/{oid}` | `POST` | Manually assign a grievance to an officer. | N/A (IDs in Path) |

---

## 4. Key Data Models (DTOs)

### `RegisterRequest` (POST)
```json
{
  "username": "student123",
  "email": "student@university.edu",
  "password": "StrongPassword123!",
  "firstName": "Ayush",
  "lastName": "Singh",
  "phoneNumber": "9876543210",
  "address": "Hostel B, Room 302"
}
```

### `GrievanceResponse` (GET)
```json
{
  "id": 101,
  "title": "Wi-Fi Issue in Library",
  "status": "PENDING",
  "priority": "HIGH",
  "createdAt": "2026-03-30T10:00:00Z",
  "departmentName": "IT Services",
  "userName": "Ayush Singh"
}
```

---

## 5. Security & Architecture Details

1.  **JWT Authentication**:
    The system is stateless. After login, every request must include:
    `Authorization: Bearer <your_jwt_token>`
2.  **Role-Based Access Control (RBAC)**:
    - `ROLE_USER`: Can submit grievances and view their own history.
    - `ROLE_OFFICER`: Can accept/update grievances assigned to their department.
    - `ROLE_ADMIN`: Can manage departments, users, and reassign grievances.
3.  **Error Handling**:
    Global exception handling is implemented in `com.grievance.exception.GlobalExceptionHandler`, returning uniform error messages with HTTP status codes (e.g., 404 for Not Found, 403 for Forbidden).
