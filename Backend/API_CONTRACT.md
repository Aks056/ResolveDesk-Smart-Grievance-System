# Smart Grievance System — API Contract

> **Base URL:** `http://localhost:8081` (or via Vite proxy at `/api`)
> **Auth:** `/api/auth/**` is public. All other `/api/**` require JWT Bearer.
> **Pagination:** 5 endpoints return `Page<T>` — see [Envelope](#paginated-response-envelope).

> **Privacy:** Cases are private by default. Private details, evidence, history, and
> feedback require the owning USER, assigned same-department OFFICER, or ADMIN.
> Community endpoints expose only explicitly reviewed, published summaries.
> See [Privacy Migration](PRIVACY_MIGRATION.md) for exact DTOs and required rollout steps.

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
**Response:** 200 OK - GrievanceResponse[] (at most 5 authorized cases: own for USER, assigned same-department for OFFICER, global for ADMIN)

---

### GET /api/grievances/{id}
**Auth:** Owner USER, assigned same-department OFFICER, or ADMIN
**Response:** 200 OK - GrievanceResponse

---

### GET /api/grievances/assigned
**Auth:** ROLE_OFFICER or ROLE_ADMIN
**Query:** scope=DEPT_POOL|MY_TASKS|RESOLVED (omitted defaults to MY_TASKS; invalid/empty returns 400)
**Response:** 200 OK - GrievanceResponse[] for authorized MY_TASKS/RESOLVED cases, or minimal GrievanceQueueResponse[] for DEPT_POOL. Pool entries do not grant private detail access.

---

### PUT /api/grievances/{id}/status
**Auth:** Assigned same-department OFFICER or ADMIN
{"status":"RESOLVED","resolutionRemarks":"...","remarks":"Optional","visibility":"INTERNAL"}

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | GrievanceStatus | Yes | Valid transition |
| resolutionRemarks | String | Cond | Required for RESOLVED/REJECTED |
| remarks | String | No | Alternative to resolutionRemarks |
| visibility | HistoryVisibility | No | INTERNAL by default; PARTICIPANTS explicitly shares with owner; PUBLIC rejected |

**Response:** 200 OK - GrievanceResponse

---

### DELETE /api/grievances/{id}
**Auth:** ROLE_ADMIN
**Response:** 204 No Content

---

### GET /api/grievances/all - PAGINATED
**Auth:** Any authenticated
**Query:** page=0&size=10 (page >= 0, size >= 1, size capped at 100)
**Response:** 200 OK - Spring Page<PublicGrievanceResponse>, published summaries only
> Read response.data.content as the array!

---

### GET /api/grievances - PAGINATED
**Auth:** ROLE_ADMIN
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
**Auth:** Private case access required
**Response:** 200 OK - GrievanceHistoryResponse[]. Owners cannot see INTERNAL entries; legacy null visibility and internal markers fail closed.

---

### PUT /api/grievances/{id}/priority
**Auth:** Assigned same-department OFFICER or ADMIN
**Query:** priority=LOW/MEDIUM/HIGH
**Response:** 200 OK - GrievanceResponse

---

### GET /api/grievances/officers
**Auth:** ROLE_OFFICER or ROLE_ADMIN
**Response:** 200 OK - OfficerDirectoryResponse[] (id, firstName, lastName, departmentId, departmentName only)

---

### POST /api/grievances/{id}/upvote
**Auth:** Any authenticated
Toggle upvote on a published case only; unpublished cases return 404.
**Response:** 200 OK - {upvoteCount, hasUpvoted}

### GET /api/grievances/public/{publicId}
**Auth:** Any authenticated
**Response:** PublicGrievanceResponse; withdrawn or missing UUID returns 404.
Fields: publicId, publicTitle, publicSummary, departmentName, status, createdDate,
upvoteCount, hasUpvoted. No raw private text, identity, numeric case ID, or evidence.

### POST /api/grievances/public/{publicId}/upvote
**Auth:** Any authenticated
**Response:** {upvoteCount, hasUpvoted}; published UUIDs only.

### PUT /api/grievances/{id}/publication
**Auth:** ROLE_ADMIN
**Request:** {"published":true,"publicTitle":"Reviewed title","publicSummary":"Reviewed summary"}
Publishing requires nonblank reviewed title (max 200) and summary (max 2000).
Raw case text is never copied automatically. Send {"published":false} to withdraw.
**Response:** Authorized private GrievanceResponse.

### GET /api/grievances/{id}/attachments/evidence
**Auth:** Private case access required
**Response:** Authenticated binary download, attachment disposition, nosniff,
private/no-store cache policy. No caller-supplied filename or path is accepted.
Legacy /uploads URLs are denied; attachmentUrl and imageUrl now reference this endpoint.

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
| GET | /api/officer/assigned-grievances | My assigned same-department grievances |

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
| POST | /api/feedback | Owner USER | {grievanceId, rating(1-5), comments?} |
| GET | /api/feedback/grievance/{id} | Private case access | FeedbackResponse[] |
| GET | /api/feedback/my | USER | My feedbacks |
| GET | /api/feedback/grievance/{id}/rating | Private case access | Double (average) |
| DELETE | /api/feedback/{id} | Creator USER with case access | 204 |

---

## Paginated Response Envelope

5 endpoints return Spring Page<T> format:

| Endpoint | Description |
|----------|-------------|
| GET /api/grievances/all | Published, reviewed summaries (PublicGrievanceResponse) |
| GET /api/grievances | All private grievances (ADMIN) |
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
| 409 | Concurrent modification; reload and reconsider the operation |
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

