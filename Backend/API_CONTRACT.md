# Smart Grievance System — API Contract

> **Base URL:** `http://localhost:8081` (or via Vite proxy at `/api`)
> **Auth:** `/api/auth/**` is public. All other `/api/**` require JWT Bearer.
> **Pagination:** 5 endpoints return `Page<T>` — see [Envelope](#paginated-response-envelope).

---

## Enums

**GrievanceStatus:** PENDING | ASSIGNED | IN_PROGRESS | RESOLVED | REJECTED | CLOSED_BY_USER

| From | Allowed To |
|------|-----------|
| PENDING | ASSIGNED, REJECTED |
| ASSIGNED | IN_PROGRESS, REJECTED |
| IN_PROGRESS | RESOLVED, REJECTED |
| RESOLVED | _(terminal)_ |
| REJECTED | _(terminal)_ |
| CLOSED_BY_USER | _(terminal)_ |

**Priority:** LOW (30d) | MEDIUM (15d) | HIGH (7d)
**Role:** USER | ADMIN | OFFICER

---

## Auth Controller

**Base path:** /api/auth
**Auth:** Public (no JWT)

### POST /api/auth/register

Register citizen. Returns JWT immediately.

**Request Body (JSON):**

{"username":"citizen1","email":"citizen1@example.com","password":"password123","firstName":"Rahul","lastName":"Sharma","phoneNumber":"9876543210","address":"123 College Road"}

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| username | String | Yes | 3-50 chars |
| email | String | Yes | Valid email |
| password | String | Yes | Min 8 chars |
| firstName | String | Yes | 2-50 chars |
| lastName | String | Yes | 2-50 chars |
| phoneNumber | String | Yes | Exactly 10 digits |
| address | String | No | Max 255 chars |

**Response:** 200 OK
{"message":"Registration successful","token":"eyJhbGci...","tokenType":"Bearer","expiresIn":86400000,"user":{/* UserResponse */}}

---

### POST /api/auth/login

**Request:** {"username":"citizen1","password":"password123"}

**Response:** 200 OK - same AuthResponse shape.
**Error:** 401 Unauthorized

---

### POST /api/auth/logout

Stateless JWT. Client discards token.
**Response:** 200 OK

---

## Grievance Controller

**Base path:** /api/grievances
**Auth:** JWT required (role-specific)

### GET /api/grievances/departments
**Auth:** ROLE_USER
**Response:** 200 OK - Department[]

---

### POST /api/grievances (Submit)
**Auth:** ROLE_USER
**Content-Type:** multipart/form-data

| Part | Type | Required | Description |
|------|------|----------|-------------|
| data | JSON string | Yes | Grievance details |
| file | Binary | No | Attachment (pdf/doc/docx/jpg/jpeg/png/txt, 5MB) |

data JSON: {"title":"...","description":"...","departmentId":1,"priority":"HIGH"}

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | String | Yes | 5-150 chars |
| description | String | Yes | 10-5000 chars |
| departmentId | Long | Yes | Must exist |
| priority | Priority | Yes | LOW/MEDIUM/HIGH |

**Response:** 201 Created - GrievanceResponse

---

### GET /api/grievances/my
**Auth:** ROLE_USER
**Response:** 200 OK - GrievanceResponse[] (not paginated)

---

### GET /api/grievances/recent
**Auth:** Any authenticated
**Response:** 200 OK - GrievanceResponse[] (5 most recent)

---

### GET /api/grievances/{id}
**Auth:** Any authenticated
**Response:** 200 OK - GrievanceResponse

---

### GET /api/grievances/assigned
**Auth:** ROLE_OFFICER or ROLE_ADMIN
**Query:** scope=DEPT_POOL|MY_TASKS|RESOLVED (or omit for all)
**Response:** 200 OK - GrievanceResponse[] (not paginated)

---

### PUT /api/grievances/{id}/status
**Auth:** ROLE_OFFICER or ROLE_ADMIN
{"status":"RESOLVED","resolutionRemarks":"...","remarks":"Optional"}

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | GrievanceStatus | Yes | Valid transition |
| resolutionRemarks | String | Cond | Required for RESOLVED/REJECTED |
| remarks | String | No | Alternative to resolutionRemarks |

**Response:** 200 OK - GrievanceResponse

---

### DELETE /api/grievances/{id}
**Auth:** ROLE_ADMIN
**Response:** 204 No Content

---

### GET /api/grievances/all - PAGINATED
**Auth:** Any authenticated
**Query:** page=0&size=10
**Response:** 200 OK - Spring Page envelope
> Read response.data.content as the array!

---

### GET /api/grievances - PAGINATED
**Auth:** ROLE_OFFICER or ROLE_ADMIN
**Response:** 200 OK - Spring Page envelope

---

### PUT /api/grievances/{id}/close
**Auth:** ROLE_USER
{"remarks":"Confirmed!"}
**Response:** 200 OK

---

### PUT /api/grievances/{id}/accept
**Auth:** ROLE_OFFICER or ROLE_ADMIN
**Response:** 200 OK - GrievanceResponse (status to IN_PROGRESS)

---

### GET /api/grievances/{id}/history
**Auth:** Any authenticated
**Response:** 200 OK - GrievanceHistoryResponse[]

---

### PUT /api/grievances/{id}/priority
**Auth:** ROLE_OFFICER or ROLE_ADMIN
**Query:** priority=LOW/MEDIUM/HIGH
**Response:** 200 OK - GrievanceResponse

---

### GET /api/grievances/officers
**Auth:** ROLE_OFFICER or ROLE_ADMIN
**Response:** 200 OK - UserResponse[]

---

### POST /api/grievances/{id}/upvote
**Auth:** Any authenticated
Toggle upvote.
**Response:** 200 OK - GrievanceResponse

---

## Admin Controller

**Base path:** /api/admin
**Auth:** ROLE_ADMIN (controller-level)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/admin/departments | Create department |
| GET | /api/admin/departments | List all departments |
| GET | /api/admin/departments/{id} | Get department |
| PUT | /api/admin/departments/{id} | Update department |
| DELETE | /api/admin/departments/{id} | Delete department |
| POST | /api/admin/grievances/{gId}/assign/{oId} | Assign grievance |
| GET | /api/admin/statistics | {totalGrievances, totalDepartments, totalUsers} |
| GET | /api/admin/grievances?page=0&size=10 | **PAGINATED** |
| GET | /api/admin/users?page=0&size=10 | **PAGINATED** (UserResponse) |
| GET | /api/admin/users/{id} | User details |
| PUT | /api/admin/users/{id}/toggle-active?isActive=true | Toggle active |
| DELETE | /api/admin/users/{id} | Delete user |

---

## Officer Controller

**Base path:** /api/officer
**Auth:** ROLE_OFFICER

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/officer/assigned-grievances | My department grievances |
| POST | /api/officer/grievances/{gId}/assign/{oId} | Reassign grievance |

---

## User Controller

**Base path:** /api/user
**Auth:** JWT required

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/user/profile | Any | Get own profile |
| PUT | /api/user/profile | Any | Update own profile |
| PUT | /api/user/change-password | Any | {oldPassword, newPassword} |
| GET | /api/user?page=0&size=10 | ADMIN | All users (paginated) |
| DELETE | /api/user/{id} | ADMIN | Delete user |
| PUT | /api/user/{id}/activate | ADMIN | Activate user |
| PUT | /api/user/{id}/deactivate | ADMIN | Deactivate user |
| PUT | /api/user/{id}/role | ADMIN | {"role":"OFFICER"} |
| PUT | /api/user/{id}/department | ADMIN | {"departmentId":1} |

---

## Dashboard Controller

**Base path:** /api/dashboard
**Auth:** JWT required

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/dashboard/user | USER | User stats |
| GET | /api/dashboard/officer | OFFICER/ADMIN | Officer dept stats |
| GET | /api/dashboard/admin | ADMIN | Admin stats + dept breakdown + trends |
| GET | /api/dashboard/statistics | Any | {PENDING, IN_PROGRESS, RESOLVED, REJECTED} counts |

---

## Feedback Controller

**Base path:** /api/feedback
**Auth:** JWT required

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/feedback | USER | {grievanceId, rating(1-5), comments?} |
| GET | /api/feedback/grievance/{id} | Any | FeedbackResponse[] |
| GET | /api/feedback/my | USER | My feedbacks |
| GET | /api/feedback/grievance/{id}/rating | Any | Double (average) |
| DELETE | /api/feedback/{id} | USER | 204 |

---

## Paginated Response Envelope

5 endpoints return Spring Page<T> format:

| Endpoint | Description |
|----------|-------------|
| GET /api/grievances/all | Global feed (names masked for USER) |
| GET /api/grievances | All grievances (ADMIN/OFFICER) |
| GET /api/admin/grievances | Admin grievance management |
| GET /api/admin/users | Admin user management |
| GET /api/user | User list (ADMIN) |

**The items array is inside the "content" field, NOT the top-level response.**

Full envelope shape:
{"content":[{/* GrievanceResponse */}],"pageable":{"sort":{"empty":true,"sorted":false,"unsorted":true},"offset":0,"pageSize":10,"pageNumber":0,"unpaged":false,"paged":true},"last":true,"totalPages":3,"totalElements":25,"size":10,"number":0,"sort":{"empty":true,"sorted":false,"unsorted":true},"first":true,"numberOfElements":10,"empty":false}

**Frontend usage:**
const response = await api.get("/grievances/all", { params: { page: 0, size: 10 } });
const items = response.data.content;          // THIS is the array
const totalPages = response.data.totalPages;
const totalElements = response.data.totalElements;
const currentPage = response.data.number;      // zero-based

---

## Error Response Shape

{"timestamp":"2026-09-07T10:30:00","status":400,"error":"Bad Request","message":"Validation failed","path":"/api/auth/register","fieldErrors":[{"field":"email","message":"Email should be valid","rejectedValue":"notanemail"}]}

| Status | When |
|--------|------|
| 400 | Validation error, bad request, invalid transition |
| 401 | Auth failed, missing/invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 500 | Server error |

fieldErrors only present for validation errors (400 on bad input).

---

## Status Transition Diagram

PENDING -> ASSIGNED -> IN_PROGRESS -> RESOLVED
  |             |              |
  +---> REJECTED <--------------+

Citizen can close: ANY -> CLOSED_BY_USER

Roles:
- ADMIN: assign, reject, update status, delete
- OFFICER: accept (ASSIGNED->IN_PROGRESS), resolve, reject
- USER: submit, close, submit feedback

---

## CORS Configuration

Allowed origins: localhost:5173, localhost:3000, localhost:8081
Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Credentials: Allowed

---

## Demo Accounts (dev profile)

| Username | Password | Role | Department |
|----------|----------|------|------------|
| admin12 | admin1234 | ADMIN | -- |
| officer1 | officer1234 | OFFICER | Hostel & Accommodation |
| officer2 | officer1234 | OFFICER | Academics & Examinations |
| officer3 | officer1234 | OFFICER | IT & Infrastructure |
| officer4 | officer1234 | OFFICER | Canteen & Mess |
| officer5 | officer1234 | OFFICER | Administration |

