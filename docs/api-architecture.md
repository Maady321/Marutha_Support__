# Ashwasa - API Architecture

This document defines the API architecture, design principles, conventions, and endpoint inventory for the Ashwasa digital health coordination platform.

## 1. API Design Principles

The Ashwasa API adheres to the following core principles:

- **RESTful design:** Utilizing standard HTTP methods and resource-oriented URLs.
- **Consistent naming conventions:** camelCase for JSON properties, kebab-case for URL segments.
- **Versioned:** All API endpoints are versioned under `/api/v1/` to ensure backward compatibility as the platform evolves.
- **JSON request/response:** All payloads use `application/json`.
- **Proper HTTP methods and status codes:** Strict adherence to HTTP semantics.
- **Cursor-based & Offset pagination:** Used for lists and collections to optimize performance and usability.
- **Query parameter filtering and sorting:** Standardized approach for complex queries.

## 2. API Conventions

- **URL structure:** `/api/v1/{resource}`
- **Plural nouns for collections:** e.g., `/api/v1/users`, `/api/v1/appointments`
- **HTTP Methods:**
  - `GET`: Read resources
  - `POST`: Create new resources
  - `PATCH`: Partially update resources
  - `DELETE`: Remove resources
- **Status codes:**
  - `200 OK`: Request successful
  - `201 Created`: Resource successfully created
  - `204 No Content`: Successful request with no body returned
  - `400 Bad Request`: Validation failure or malformed request
  - `401 Unauthorized`: Missing or invalid authentication credentials
  - `403 Forbidden`: Authenticated, but lacks required permissions/roles
  - `404 Not Found`: Resource does not exist
  - `409 Conflict`: Request conflicts with current state (e.g., double booking)
  - `422 Unprocessable Entity`: Semantic validation errors
  - `429 Too Many Requests`: Rate limit exceeded
  - `500 Internal Server Error`: Server-side failure
- **Pagination:** `?page=1&limit=20`. Responses include metadata: `{ data: [], meta: { total, page, limit, pages } }`
- **Filtering:** `?status=open&category=transport`
- **Sorting:** `?sort=createdAt&order=desc`
- **Search:** `?q=keyword`

## 3. Standard Error Response Format

All errors return a standardized JSON structure.

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Human readable message describing the error",
  "details": [
    {
      "field": "email",
      "issue": "Invalid email format"
    }
  ],
  "timestamp": "2026-08-12T11:43:46Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 4. Standard Success Response Format

**Single Resource:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Example"
  },
  "meta": {}
}
```

**Collection:**
```json
{
  "data": [
    { "id": "uuid1", "name": "Example 1" },
    { "id": "uuid2", "name": "Example 2" }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

## 5. Authentication Headers

- **Auth via HttpOnly cookies:** Access and refresh tokens are handled automatically via secure cookies to mitigate XSS attacks.
- **No Authorization header needed:** Browser clients do not need to manually attach tokens. Mobile/third-party clients might use bearer tokens if required later.
- **CSRF Protection:** State-changing requests (POST, PATCH, DELETE) require a CSRF token passed via a custom header (e.g., `X-CSRF-Token`).

## 6. Rate Limiting

Rate limiting is enforced at the gateway/reverse proxy level and application level to ensure stability.

- **General:** 100 requests/min per IP
- **Auth endpoints:** 5 requests/min per IP
- **Messaging:** 30 messages/min per user
- **File uploads:** 10 uploads/hour per user

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed in the current window.
- `X-RateLimit-Remaining`: Requests remaining in the current window.
- `X-RateLimit-Reset`: Timestamp when the rate limit window resets.

---

## 7. Complete MVP Endpoint Inventory

The platform supports 5 roles: `PATIENT`, `FAMILY_MEMBER`, `DOCTOR`, `VOLUNTEER`, `ADMIN`.

### Auth Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Register new user | No | All (Creation) | Email, pass, role, basic info | User info (no tokens) | 201, 400, 409 |
| POST | `/api/v1/auth/login` | Authenticate user | No | All | Email, password | User info (Sets Cookies) | 200, 400, 401 |
| POST | `/api/v1/auth/logout` | Logout user | Yes | All | None | Empty (Clears Cookies) | 204, 401 |
| POST | `/api/v1/auth/refresh` | Refresh access token | Yes | All | None | Empty (Updates Cookies) | 204, 401 |
| POST | `/api/v1/auth/verify-email` | Verify email address | No | All | Verification token | Success message | 200, 400 |
| POST | `/api/v1/auth/forgot-password` | Request password reset | No | All | Email | Success message | 200, 404 |
| POST | `/api/v1/auth/reset-password` | Set new password | No | All | Token, new password | Success message | 200, 400 |
| GET | `/api/v1/auth/me` | Get current session info | Yes | All | None | User profile details | 200, 401 |

### Users Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| GET | `/api/v1/users/profile` | Get own profile | Yes | All | None | User profile | 200, 401 |
| PATCH | `/api/v1/users/profile` | Update basic profile | Yes | All | Name, phone, avatar | Updated profile | 200, 400, 422 |
| PATCH | `/api/v1/users/password` | Change password | Yes | All | Old pass, new pass | Success message | 200, 400, 401 |
| DELETE | `/api/v1/users/account` | Delete/Deactivate account | Yes | All | Password confirmation | Success message | 204, 401 |

### Doctors Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| GET | `/api/v1/doctors` | List/search doctors | Yes | PATIENT, FAMILY, ADMIN | None | List of doctors | 200 |
| GET | `/api/v1/doctors/:id` | View doctor profile | Yes | All | None | Doctor profile | 200, 404 |
| PATCH | `/api/v1/doctors/profile` | Update doctor details | Yes | DOCTOR | Specialization, bio, etc. | Updated profile | 200, 403, 422 |
| POST | `/api/v1/doctors/availability`| Add availability slots | Yes | DOCTOR | Array of time slots | Created slots | 201, 400, 409 |
| GET | `/api/v1/doctors/availability`| Get own availability | Yes | DOCTOR | None | List of slots | 200 |
| DELETE | `/api/v1/doctors/availability/:slotId`| Remove availability slot | Yes | DOCTOR | None | Empty | 204, 403, 404 |

### Patients Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| PATCH | `/api/v1/patients/profile` | Update medical profile | Yes | PATIENT | Medical history, conditions | Updated profile | 200, 403, 422 |
| GET | `/api/v1/patients/dashboard` | Get dashboard summary | Yes | PATIENT | None | Summary stats | 200, 403 |
| POST | `/api/v1/patients/family/invite`| Generate family invite | Yes | PATIENT | Expiry details | Invite code/link | 201, 403 |
| DELETE | `/api/v1/patients/family/:familyUserId`| Revoke family access | Yes | PATIENT | None | Empty | 204, 403, 404 |

### Volunteers Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| PATCH | `/api/v1/volunteers/profile` | Update skills/areas | Yes | VOLUNTEER | Skills, service areas | Updated profile | 200, 403, 422 |
| PATCH | `/api/v1/volunteers/availability`| Update availability | Yes | VOLUNTEER | Availability schedule | Updated availability | 200, 403 |
| GET | `/api/v1/volunteers/dashboard` | Get dashboard summary | Yes | VOLUNTEER | None | Summary stats | 200, 403 |

### Family Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| POST | `/api/v1/family/link` | Link to patient via code | Yes | FAMILY_MEMBER | Invite code | Link success details | 200, 400, 404 |
| GET | `/api/v1/family/patient` | View linked patient info | Yes | FAMILY_MEMBER | None | Patient overview | 200, 403 |

### Appointments Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| POST | `/api/v1/appointments` | Book appointment | Yes | PATIENT | Doctor ID, slot ID, reason | Created appointment | 201, 400, 409 |
| GET | `/api/v1/appointments` | List appointments | Yes | All | None | List of appointments | 200 |
| GET | `/api/v1/appointments/:id` | View appointment details| Yes | All (Involved) | None | Appointment details | 200, 403, 404 |
| PATCH | `/api/v1/appointments/:id/accept`| Doctor accepts | Yes | DOCTOR | None | Updated appointment | 200, 403, 409 |
| PATCH | `/api/v1/appointments/:id/reject`| Doctor rejects | Yes | DOCTOR | Reason | Updated appointment | 200, 403, 409 |
| PATCH | `/api/v1/appointments/:id/cancel`| Cancel appointment | Yes | PATIENT, DOCTOR | Reason | Updated appointment | 200, 403, 409 |
| PATCH | `/api/v1/appointments/:id/complete`| Mark complete | Yes | DOCTOR | Notes | Updated appointment | 200, 403, 409 |

### Support Requests Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| POST | `/api/v1/support-requests` | Create support request | Yes | PATIENT, FAMILY | Title, desc, type, urgency | Created request | 201, 400, 422 |
| GET | `/api/v1/support-requests` | List requests | Yes | All | None | List of requests | 200 |
| GET | `/api/v1/support-requests/:id` | View request details | Yes | All | None | Request details | 200, 403, 404 |
| PATCH | `/api/v1/support-requests/:id` | Update request | Yes | PATIENT, FAMILY | Title, desc, urgency | Updated request | 200, 403, 404 |
| PATCH | `/api/v1/support-requests/:id/accept`| Volunteer accepts | Yes | VOLUNTEER | None | Updated request | 200, 403, 409 |
| PATCH | `/api/v1/support-requests/:id/cancel`| Cancel request | Yes | PATIENT, FAMILY | Reason | Updated request | 200, 403, 409 |
| PATCH | `/api/v1/support-requests/:id/complete`| Mark complete | Yes | VOLUNTEER, PATIENT | Feedback | Updated request | 200, 403, 409 |

### Messaging Endpoints (REST + WebSocket)

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| GET | `/api/v1/conversations` | List conversations | Yes | All | None | List of conversations | 200 |
| GET | `/api/v1/conversations/:id` | Get conversation msgs | Yes | All (Involved) | None | Conversation + Msgs | 200, 403, 404 |
| POST | `/api/v1/conversations/:id/messages`| Send message | Yes | All (Involved) | Content, attachments | Sent message | 201, 400, 403 |
| PATCH | `/api/v1/conversations/:id/read` | Mark msgs as read | Yes | All (Involved) | None | Success status | 200, 403 |

**WebSocket Events:**
- `message:send` (Client -> Server)
- `message:new` (Server -> Client)
- `message:read` (Client <-> Server)
- `typing:start` (Client <-> Server)
- `typing:stop` (Client <-> Server)

### Notifications Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| GET | `/api/v1/notifications` | List notifications | Yes | All | None | List of notifications | 200 |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read | Yes | All | None | Updated notification | 200, 403, 404 |
| PATCH | `/api/v1/notifications/read-all` | Mark all as read | Yes | All | None | Success status | 200 |
| GET | `/api/v1/notifications/unread-count`| Get unread count | Yes | All | None | Count integer | 200 |

### Resources Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| GET | `/api/v1/resources` | List educational resources | No | All | None | List of resources | 200 |
| GET | `/api/v1/resources/:id` | Get resource details | No | All | None | Resource details | 200, 404 |
| POST | `/api/v1/resources` | Create resource | Yes | ADMIN | Title, content, category | Created resource | 201, 400, 403 |
| PATCH | `/api/v1/resources/:id` | Update resource | Yes | ADMIN | Title, content, category | Updated resource | 200, 403, 404 |
| DELETE | `/api/v1/resources/:id` | Delete resource | Yes | ADMIN | None | Empty | 204, 403, 404 |

### Files Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| POST | `/api/v1/files/upload` | Upload a file | Yes | All | Form-data (file) | File metadata (URL) | 201, 400, 413 |
| GET | `/api/v1/files/:id` | Access/Download file | Yes | All (Authorized) | None | File stream | 200, 403, 404 |
| DELETE | `/api/v1/files/:id` | Delete uploaded file | Yes | All (Owner/Admin) | None | Empty | 204, 403, 404 |

### Admin Endpoints

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| GET | `/api/v1/admin/users` | List all users | Yes | ADMIN | None | List of users | 200, 403 |
| GET | `/api/v1/admin/users/:id` | Get specific user | Yes | ADMIN | None | User profile details | 200, 403, 404 |
| PATCH | `/api/v1/admin/users/:id/verify` | Verify professional | Yes | ADMIN | None | Updated user | 200, 403, 404 |
| PATCH | `/api/v1/admin/users/:id/reject` | Reject verification | Yes | ADMIN | Reason | Updated user | 200, 403, 404 |
| PATCH | `/api/v1/admin/users/:id/suspend`| Suspend user account | Yes | ADMIN | Reason | Updated user | 200, 403, 404 |
| PATCH | `/api/v1/admin/users/:id/unsuspend`| Unsuspend user | Yes | ADMIN | None | Updated user | 200, 403, 404 |
| GET | `/api/v1/admin/verification-queue` | Get pending verifications| Yes | ADMIN | None | List of pending users | 200, 403 |
| GET | `/api/v1/admin/reports` | View platform reports | Yes | ADMIN | None | List of reports | 200, 403 |
| GET | `/api/v1/admin/audit-logs` | View audit logs | Yes | ADMIN | None | List of logs | 200, 403 |
| GET | `/api/v1/admin/analytics/overview` | Platform analytics | Yes | ADMIN | None | Analytics metrics | 200, 403 |

### Health

| Method | Path | Description | Auth Required | Roles Allowed | Request Body | Response | Status Codes |
|---|---|---|---|---|---|---|---|
| GET | `/api/v1/health` | System health check | No | All | None | Service status | 200, 503 |
