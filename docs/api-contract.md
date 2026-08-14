# Ashwasa API Contract

**Base URL:** `/api/v1`
**Content-Type:** `application/json` (unless otherwise specified)
**Authentication:** JWT via HttpOnly Secure Cookies (Access: 15min, Refresh: 7 days)
**Database / Backend:** PostgreSQL 16 / Prisma ORM / NestJS 10 (TypeScript)
**Roles:** PATIENT, FAMILY_MEMBER, DOCTOR, VOLUNTEER, ADMIN

---

## 1. Authentication API (`/api/v1/auth`)

### POST /api/v1/auth/register
- **Description:** Register new user
- **Auth Required:** No
- **Roles:** None
- **Request Body:**
```json
{
  "email": "string (required, valid email, max 255)",
  "password": "string (required, min 8, uppercase+lowercase+number)",
  "firstName": "string (required, max 100)",
  "lastName": "string (required, max 100)",
  "role": "PATIENT | FAMILY_MEMBER | DOCTOR | VOLUNTEER (required)",
  "phone": "string (optional)",
  "city": "string (optional)"
}
```
*Note: ADMIN role cannot be self-registered.*
- **Response (201):** `{ "data": { "id": "uuid", "email": "string", "firstName": "string", "lastName": "string", "role": "string", "accountStatus": "PENDING_VERIFICATION|ACTIVE" } }`
- **Errors:** AUTH_EMAIL_ALREADY_EXISTS (409), AUTH_WEAK_PASSWORD (422), VALIDATION_FAILED (422)
- **Rate Limit:** 3/min per IP
- **Side Effects:** Sends verification email, creates audit log

### POST /api/v1/auth/login
- **Description:** Login
- **Auth Required:** No
- **Roles:** None
- **Request Body:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required)"
}
```
- **Response (200):** `{ "data": { "id": "uuid", "email": "string", "role": "string" } }`
- **Headers:** `Set-Cookie: access_token=...; refresh_token=...`
- **Errors:** AUTH_INVALID_CREDENTIALS (401), AUTH_ACCOUNT_LOCKED (403), VALIDATION_FAILED (422)
- **Rate Limit:** 5/min per IP

### POST /api/v1/auth/logout
- **Description:** Logout (clear cookies)
- **Auth Required:** Yes
- **Roles:** Any
- **Request Body:** None
- **Response (200):** `{ "message": "Logged out successfully" }`
- **Headers:** `Set-Cookie: access_token=; refresh_token=; (cleared)`
- **Errors:** UNAUTHORIZED (401)
- **Rate Limit:** 10/min per IP

### POST /api/v1/auth/refresh
- **Description:** Refresh access token
- **Auth Required:** Yes (via refresh token Cookie)
- **Roles:** None
- **Request Body:** None
- **Response (200):** `{ "message": "Token refreshed" }`
- **Headers:** `Set-Cookie: access_token=...; refresh_token=... (rotated)`
- **Errors:** UNAUTHORIZED (401), INVALID_REFRESH_TOKEN (403)
- **Rate Limit:** 10/min per IP

### POST /api/v1/auth/verify-email
- **Description:** Verify email with token
- **Auth Required:** No
- **Roles:** None
- **Request Body:**
```json
{
  "token": "string (required)"
}
```
- **Response (200):** `{ "message": "Email verified successfully" }`
- **Errors:** INVALID_TOKEN (400), TOKEN_EXPIRED (400)
- **Rate Limit:** 5/min per IP

### POST /api/v1/auth/forgot-password
- **Description:** Request password reset
- **Auth Required:** No
- **Roles:** None
- **Request Body:**
```json
{
  "email": "string (required, valid email)"
}
```
- **Response (200):** `{ "message": "If the email exists, a reset link has been sent" }`
- **Errors:** VALIDATION_FAILED (422)
- **Rate Limit:** 3/min per IP

### POST /api/v1/auth/reset-password
- **Description:** Reset password with token
- **Auth Required:** No
- **Roles:** None
- **Request Body:**
```json
{
  "token": "string (required)",
  "newPassword": "string (required, min 8, uppercase+lowercase+number)"
}
```
- **Response (200):** `{ "message": "Password reset successfully" }`
- **Errors:** INVALID_TOKEN (400), TOKEN_EXPIRED (400), AUTH_WEAK_PASSWORD (422)
- **Rate Limit:** 3/min per IP

### GET /api/v1/auth/me
- **Description:** Get current logged-in user basic info
- **Auth Required:** Yes
- **Roles:** Any
- **Request Body:** None
- **Response (200):** `{ "data": { "id": "uuid", "email": "string", "role": "string", "firstName": "string", "lastName": "string", "accountStatus": "string" } }`
- **Errors:** UNAUTHORIZED (401)

---

## 2. User API (`/api/v1/users`)

### GET /api/v1/users/me
- **Description:** Get own comprehensive profile
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "data": { "id": "uuid", "email": "string", "firstName": "string", "lastName": "string", "phone": "string", "city": "string", "role": "string", "avatarUrl": "string", "createdAt": "datetime" } }`
- **Errors:** UNAUTHORIZED (401)

### PATCH /api/v1/users/me
- **Description:** Update own profile
- **Auth Required:** Yes
- **Roles:** Any
- **Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "city": "string (optional)",
  "avatarUrl": "string (optional)"
}
```
- **Response (200):** `{ "data": { ...updatedProfile } }`
- **Errors:** UNAUTHORIZED (401), VALIDATION_FAILED (422)

### DELETE /api/v1/users/me
- **Description:** Deactivate account (soft delete)
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "message": "Account deactivated" }`
- **Errors:** UNAUTHORIZED (401)
- **Side Effects:** Logs out user, cancels pending requests

### PATCH /api/v1/users/me/preferences
- **Description:** Update notification preferences
- **Auth Required:** Yes
- **Roles:** Any
- **Request Body:**
```json
{
  "emailNotifications": "boolean (optional)",
  "smsNotifications": "boolean (optional)",
  "pushNotifications": "boolean (optional)"
}
```
- **Response (200):** `{ "data": { ...updatedPreferences } }`
- **Errors:** UNAUTHORIZED (401), VALIDATION_FAILED (422)

---

## 3. Patient API (`/api/v1/patients`)

### GET /api/v1/patients/me
- **Description:** Get patient specific profile
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Response (200):** `{ "data": { "medicalHistory": "string", "bloodGroup": "string", "emergencyContact": "string" } }`
- **Errors:** FORBIDDEN (403)

### PATCH /api/v1/patients/me
- **Description:** Update patient specific profile
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Request Body:**
```json
{
  "medicalHistory": "string (optional)",
  "bloodGroup": "string (optional)",
  "emergencyContact": "string (optional)"
}
```
- **Response (200):** `{ "data": { ...updatedPatientProfile } }`
- **Errors:** FORBIDDEN (403)

### GET /api/v1/patients/me/appointments
- **Description:** List own appointments
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Response (200):** `{ "data": [ { "id": "uuid", "doctorId": "uuid", "status": "string", "scheduledDate": "date", ... } ] }`

### GET /api/v1/patients/me/support-requests
- **Description:** List own support requests
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Response (200):** `{ "data": [ { "id": "uuid", "title": "string", "status": "string", ... } ] }`

### GET /api/v1/patients/me/family
- **Description:** List family relationships
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Response (200):** `{ "data": [ { "id": "uuid", "familyMemberId": "uuid", "status": "ACTIVE|REVOKED", "member": { "firstName": "string", ... } } ] }`

### POST /api/v1/patients/me/family/invite
- **Description:** Generate family invite code
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Request Body:** None
- **Response (201):** `{ "data": { "inviteCode": "string (expires in 24h)" } }`

---

## 4. Doctor API (`/api/v1/doctors`)

### GET /api/v1/doctors
- **Description:** Search/list verified doctors (public profiles)
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "data": [ { "id": "uuid", "firstName": "string", "lastName": "string", "specialty": "string", "hospital": "string", "city": "string", "yearsOfExperience": "number", "isAcceptingPatients": "boolean", "avatarUrl": "string" } ] }`
- **Important:** Does NOT return email, phone, licenseNumber, verificationDocuments.

### GET /api/v1/doctors/:id
- **Description:** Get doctor public profile
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "data": { "id": "uuid", ... (same as GET /doctors) } }`
- **Errors:** NOT_FOUND (404)

### GET /api/v1/doctors/me
- **Description:** Get own doctor profile (full details)
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **Response (200):** `{ "data": { "id": "uuid", "specialty": "string", "licenseNumber": "string", "verificationStatus": "string", ... } }`

### PATCH /api/v1/doctors/me
- **Description:** Update own doctor profile
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **Request Body:**
```json
{
  "specialty": "string (optional)",
  "hospital": "string (optional)",
  "yearsOfExperience": "number (optional)",
  "isAcceptingPatients": "boolean (optional)"
}
```
- **Response (200):** `{ "data": { ...updatedDoctorProfile } }`

### GET /api/v1/doctors/me/availability
- **Description:** Get own availability slots
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **Response (200):** `{ "data": [ { "id": "uuid", "date": "date", "startTime": "time", "endTime": "time", "isBooked": "boolean" } ] }`

### POST /api/v1/doctors/me/availability
- **Description:** Create availability slot(s)
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **Request Body:**
```json
{
  "slots": [
    {
      "date": "YYYY-MM-DD (required)",
      "startTime": "HH:MM (required)",
      "endTime": "HH:MM (required)"
    }
  ]
}
```
- **Response (201):** `{ "message": "Slots created successfully" }`

### DELETE /api/v1/doctors/me/availability/:slotId
- **Description:** Delete availability slot
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **Response (200):** `{ "message": "Slot deleted" }`
- **Errors:** NOT_FOUND (404), CONFLICT (409) if slot is booked.

### GET /api/v1/doctors/me/appointments
- **Description:** List own appointments
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **Response (200):** `{ "data": [ { ...appointments } ] }`

### GET /api/v1/doctors/:id/availability
- **Description:** Get doctor's available (unbooked) slots
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "data": [ { "id": "uuid", "date": "date", "startTime": "time", "endTime": "time" } ] }`

---

## 5. Volunteer API (`/api/v1/volunteers`)

### GET /api/v1/volunteers/me
- **Description:** Get own volunteer profile
- **Auth Required:** Yes
- **Roles:** VOLUNTEER
- **Response (200):** `{ "data": { "skills": ["string"], "verificationStatus": "string", "tasksCompleted": "number" } }`

### PATCH /api/v1/volunteers/me
- **Description:** Update volunteer profile
- **Auth Required:** Yes
- **Roles:** VOLUNTEER
- **Request Body:**
```json
{
  "skills": ["string (optional)"],
  "availability": "string (optional)"
}
```
- **Response (200):** `{ "data": { ...updatedProfile } }`

### GET /api/v1/volunteers/me/tasks
- **Description:** List assigned/completed tasks (support requests)
- **Auth Required:** Yes
- **Roles:** VOLUNTEER
- **Response (200):** `{ "data": [ { ...supportRequests } ] }`

---

## 6. Family API (`/api/v1/family`)

*Important: Family endpoints MUST verify active FamilyRelationship before returning any data.*

### POST /api/v1/family/accept-invite
- **Description:** Accept invite code
- **Auth Required:** Yes
- **Roles:** FAMILY_MEMBER
- **Request Body:**
```json
{
  "inviteCode": "string (required)"
}
```
- **Response (201):** `{ "message": "Successfully linked to patient" }`

### GET /api/v1/family/relationships
- **Description:** List linked patients
- **Auth Required:** Yes
- **Roles:** FAMILY_MEMBER
- **Response (200):** `{ "data": [ { "patientId": "uuid", "patient": { "firstName": "string", ... } } ] }`

### GET /api/v1/family/relationships/:id
- **Description:** Get relationship details
- **Auth Required:** Yes
- **Roles:** PATIENT, FAMILY_MEMBER
- **Response (200):** `{ "data": { "id": "uuid", "status": "ACTIVE", "createdAt": "datetime", ... } }`

### PATCH /api/v1/family/relationships/:id/revoke
- **Description:** Revoke family access
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Response (200):** `{ "message": "Access revoked" }`

### GET /api/v1/family/patients/:patientId/appointments
- **Description:** View linked patient's appointments
- **Auth Required:** Yes
- **Roles:** FAMILY_MEMBER
- **Response (200):** `{ "data": [ { ...appointments } ] }`

### GET /api/v1/family/patients/:patientId/support-requests
- **Description:** View linked patient's support requests
- **Auth Required:** Yes
- **Roles:** FAMILY_MEMBER
- **Response (200):** `{ "data": [ { ...requests } ] }`

### POST /api/v1/family/patients/:patientId/support-requests
- **Description:** Create support request for linked patient
- **Auth Required:** Yes
- **Roles:** FAMILY_MEMBER
- **Request Body:** (Same as POST /support-requests)
- **Response (201):** `{ "data": { ...createdRequest } }`

---

## 7. Appointment API (`/api/v1/appointments`)

### POST /api/v1/appointments
- **Description:** Create appointment request
- **Auth Required:** Yes
- **Roles:** PATIENT
- **Request Body:**
```json
{
  "doctorId": "UUID (required)",
  "slotId": "UUID (required)",
  "scheduledDate": "DATE (required)",
  "startTime": "TIME (required)",
  "endTime": "TIME (required)",
  "reason": "string (optional, max 500)"
}
```
- **Response (201):** `{ "data": { "id": "uuid", "status": "REQUESTED", ... } }`
- **Concurrency:** Requires locking the slotId to avoid double booking.

### GET /api/v1/appointments/:id
- **Description:** Get appointment details
- **Auth Required:** Yes
- **Roles:** PATIENT, DOCTOR, FAMILY_MEMBER, ADMIN
- **Response (200):** `{ "data": { "id": "uuid", "status": "string", ... } }`

### PATCH /api/v1/appointments/:id/confirm
- **Description:** Confirm appointment
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **State Transition:** `REQUESTED → CONFIRMED`
- **Response (200):** `{ "message": "Appointment confirmed" }`
- **Side Effects:** Creates active conversation between doctor and patient, sends notification.

### PATCH /api/v1/appointments/:id/reject
- **Description:** Reject appointment
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **State Transition:** `REQUESTED → REJECTED`
- **Response (200):** `{ "message": "Appointment rejected" }`
- **Side Effects:** Frees up the slot, sends notification.

### PATCH /api/v1/appointments/:id/cancel
- **Description:** Cancel appointment
- **Auth Required:** Yes
- **Roles:** PATIENT, DOCTOR
- **State Transition:** `REQUESTED|CONFIRMED → CANCELLED`
- **Response (200):** `{ "message": "Appointment cancelled" }`
- **Side Effects:** Frees slot, closes conversation if exists, sends notification.

### PATCH /api/v1/appointments/:id/complete
- **Description:** Mark appointment completed
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **State Transition:** `CONFIRMED → COMPLETED`
- **Response (200):** `{ "message": "Appointment completed" }`

### PATCH /api/v1/appointments/:id/no-show
- **Description:** Mark patient no-show
- **Auth Required:** Yes
- **Roles:** DOCTOR
- **State Transition:** `CONFIRMED → NO_SHOW`
- **Response (200):** `{ "message": "Marked as no-show" }`

---

## 8. Support Request API (`/api/v1/support-requests`)

### POST /api/v1/support-requests
- **Description:** Create support request
- **Auth Required:** Yes
- **Roles:** PATIENT, FAMILY_MEMBER
- **Request Body:**
```json
{
  "category": "string (required)",
  "description": "string (required)",
  "priority": "LOW|MEDIUM|HIGH (required)",
  "city": "string (required)"
}
```
- **Response (201):** `{ "data": { "id": "uuid", "status": "OPEN", ... } }`

### GET /api/v1/support-requests
- **Description:** Browse open support requests
- **Auth Required:** Yes
- **Roles:** VOLUNTEER
- **Query Params:** `?category=x&city=y`
- **Response (200):** `{ "data": [ { ...requests (OPEN only) } ] }`
- **Note:** Volunteer must be VERIFIED.

### GET /api/v1/support-requests/:id
- **Description:** Get request details
- **Auth Required:** Yes
- **Roles:** PATIENT, FAMILY_MEMBER, VOLUNTEER, ADMIN
- **Response (200):** `{ "data": { ...requestDetails } }`

### PATCH /api/v1/support-requests/:id/accept
- **Description:** Accept (volunteer self-assigns)
- **Auth Required:** Yes
- **Roles:** VOLUNTEER
- **State Transition:** `OPEN → ASSIGNED`
- **Response (200):** `{ "message": "Request accepted" }`
- **Side Effects:** Creates conversation between volunteer and patient.

### PATCH /api/v1/support-requests/:id/start
- **Description:** Mark in progress
- **Auth Required:** Yes
- **Roles:** VOLUNTEER
- **State Transition:** `ASSIGNED → IN_PROGRESS`
- **Response (200):** `{ "message": "Request started" }`

### PATCH /api/v1/support-requests/:id/complete
- **Description:** Mark completed
- **Auth Required:** Yes
- **Roles:** VOLUNTEER
- **State Transition:** `IN_PROGRESS → COMPLETED`
- **Response (200):** `{ "message": "Request completed" }`
- **Side Effects:** Closes conversation.

### PATCH /api/v1/support-requests/:id/cancel
- **Description:** Cancel request
- **Auth Required:** Yes
- **Roles:** PATIENT, FAMILY_MEMBER (Also Volunteer can unassign `ASSIGNED -> OPEN`)
- **State Transition:** `OPEN|ASSIGNED|IN_PROGRESS → CANCELLED`
- **Response (200):** `{ "message": "Request cancelled" }`

---

## 9. Messaging API (`/api/v1/conversations`)

*Authorization: User must be in `conversation_participants` table AND conversation status must be ACTIVE.*

### GET /api/v1/conversations
- **Description:** List own conversations
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "data": [ { "id": "uuid", "participants": [...], "contextType": "APPOINTMENT|SUPPORT", "contextId": "uuid", "status": "ACTIVE", "unreadCount": 0 } ] }`

### GET /api/v1/conversations/:id
- **Description:** Get conversation with recent messages
- **Auth Required:** Yes
- **Roles:** Participant
- **Response (200):** `{ "data": { "id": "uuid", "messages": [...] } }`

### GET /api/v1/conversations/:id/messages
- **Description:** Get messages (cursor-paginated)
- **Auth Required:** Yes
- **Roles:** Participant
- **Query Params:** `?cursor=msgId&limit=50`
- **Response (200):** `{ "data": [...50 messages, newest first], "nextCursor": "uuid" }`

### POST /api/v1/conversations/:id/messages
- **Description:** Send message
- **Auth Required:** Yes
- **Roles:** Participant
- **Request Body:**
```json
{
  "content": "string (required)",
  "attachmentId": "uuid (optional, from Files API)"
}
```
- **Response (201):** `{ "data": { "id": "uuid", "content": "string", ... } }`

### PATCH /api/v1/conversations/:id/read
- **Description:** Mark conversation as read
- **Auth Required:** Yes
- **Roles:** Participant
- **Response (200):** `{ "message": "Conversation marked as read" }`

---

## 10. Notification API (`/api/v1/notifications`)

### GET /api/v1/notifications
- **Description:** List own notifications (paginated)
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "data": [ { "id": "uuid", "type": "string", "message": "string", "isRead": boolean, "createdAt": "datetime" } ], "meta": { "total": number } }`

### PATCH /api/v1/notifications/:id/read
- **Description:** Mark single notification read
- **Auth Required:** Yes
- **Roles:** Owner
- **Response (200):** `{ "message": "Notification read" }`

### PATCH /api/v1/notifications/read-all
- **Description:** Mark all notifications read
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "message": "All notifications marked read" }`

### GET /api/v1/notifications/unread-count
- **Description:** Get unread count
- **Auth Required:** Yes
- **Roles:** Any
- **Response (200):** `{ "data": { "count": number } }`

---

## 11. Resource API (`/api/v1/resources`)

### GET /api/v1/resources
- **Description:** List published resources (public)
- **Auth Required:** No
- **Roles:** None
- **Response (200):** `{ "data": [ { "id": "uuid", "title": "string", "summary": "string", "url": "string" } ] }`

### GET /api/v1/resources/:id
- **Description:** Get single published resource
- **Auth Required:** No
- **Roles:** None
- **Response (200):** `{ "data": { "id": "uuid", "title": "string", "content": "string", ... } }`

---

## 12. File API (`/api/v1/files`)

### POST /api/v1/files/upload
- **Description:** Upload file
- **Auth Required:** Yes
- **Roles:** Any
- **Request Format:** `multipart/form-data`
  - `file`: binary (required)
  - `purpose`: "AVATAR|VERIFICATION_DOC|MESSAGE_ATTACHMENT" (required)
  - `linkedEntityType`: string (optional)
  - `linkedEntityId`: uuid (optional)
- **Limits:** Avatar 2MB (JPG/PNG), Verification 5MB (PDF/JPG/PNG), Attachment 5MB
- **Response (201):** `{ "data": { "id": "uuid", "url": "string" } }`

### GET /api/v1/files/:id
- **Description:** Get file metadata
- **Auth Required:** Yes
- **Roles:** Owner, ADMIN
- **Response (200):** `{ "data": { "id": "uuid", "filename": "string", "mimeType": "string", "size": number, "url": "string" } }`

### DELETE /api/v1/files/:id
- **Description:** Delete file
- **Auth Required:** Yes
- **Roles:** Owner, ADMIN
- **Response (200):** `{ "message": "File deleted" }`

---

## 13. Admin API (`/api/v1/admin`)

### GET /api/v1/admin/users
- **Description:** List all users (paginated, filterable)
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "data": [ { ...userProfiles } ], "meta": { ...pagination } }`

### GET /api/v1/admin/users/:id
- **Description:** Get user details
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "data": { ...userFullProfile } }`

### PATCH /api/v1/admin/users/:id/suspend
- **Description:** Suspend user
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "message": "User suspended" }`

### PATCH /api/v1/admin/users/:id/activate
- **Description:** Reactivate user
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "message": "User activated" }`

### GET /api/v1/admin/verification-queue
- **Description:** List pending verifications
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "data": [ { "userId": "uuid", "role": "string", "documents": [...] } ] }`

### PATCH /api/v1/admin/users/:id/verify
- **Description:** Approve doctor/volunteer verification
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "message": "User verified" }`

### PATCH /api/v1/admin/users/:id/reject-verification
- **Description:** Reject verification
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "message": "Verification rejected" }`

### GET /api/v1/admin/reports
- **Description:** List abuse reports
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "data": [ { ...reports } ] }`

### PATCH /api/v1/admin/reports/:id/review
- **Description:** Review report
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "message": "Report reviewed" }`

### GET /api/v1/admin/audit-logs
- **Description:** Search audit logs
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "data": [ { ...logs } ] }`

### GET /api/v1/admin/analytics
- **Description:** Dashboard analytics
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "data": { "totalUsers": number, "activeAppointments": number, ... } }`

### POST /api/v1/admin/resources
- **Description:** Create resource
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Request Body:**
```json
{
  "title": "string (required)",
  "content": "string (required)",
  "isPublished": "boolean (required)"
}
```
- **Response (201):** `{ "data": { "id": "uuid", ... } }`

### PATCH /api/v1/admin/resources/:id
- **Description:** Update resource
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "data": { ...updatedResource } }`

### DELETE /api/v1/admin/resources/:id
- **Description:** Archive resource
- **Auth Required:** Yes
- **Roles:** ADMIN
- **Response (200):** `{ "message": "Resource archived" }`

---

## 14. Health API

### GET /api/v1/health
- **Description:** Health check
- **Auth Required:** No
- **Roles:** None
- **Response (200):** `{ "status": "ok", "timestamp": "datetime" }`

### GET /api/v1/health/ready
- **Description:** Readiness check (DB connection)
- **Auth Required:** No
- **Roles:** None
- **Response (200):** `{ "status": "ready", "database": "connected" }`
- **Errors:** SERVICE_UNAVAILABLE (503)

---

## 15. Complete Endpoint Summary Table

| # | Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|---|
| 1 | POST | `/auth/register` | No | - | Register new user |
| 2 | POST | `/auth/login` | No | - | Login |
| 3 | POST | `/auth/logout` | Yes | Any | Logout (clear cookies) |
| 4 | POST | `/auth/refresh` | Cookie | - | Refresh access token |
| 5 | POST | `/auth/verify-email` | No | - | Verify email with token |
| 6 | POST | `/auth/forgot-password` | No | - | Request password reset |
| 7 | POST | `/auth/reset-password` | No | - | Reset password with token |
| 8 | GET | `/auth/me` | Yes | Any | Get current user |
| 9 | GET | `/users/me` | Yes | Any | Get own profile |
| 10 | PATCH | `/users/me` | Yes | Any | Update own profile |
| 11 | DELETE | `/users/me` | Yes | Any | Deactivate account (soft delete) |
| 12 | PATCH | `/users/me/preferences` | Yes | Any | Update notification preferences |
| 13 | GET | `/patients/me` | Yes | PATIENT | Get patient profile |
| 14 | PATCH | `/patients/me` | Yes | PATIENT | Update patient profile |
| 15 | GET | `/patients/me/appointments` | Yes | PATIENT | List own appointments |
| 16 | GET | `/patients/me/support-requests` | Yes | PATIENT | List own support requests |
| 17 | GET | `/patients/me/family` | Yes | PATIENT | List family relationships |
| 18 | POST | `/patients/me/family/invite` | Yes | PATIENT | Generate family invite code |
| 19 | GET | `/doctors` | Yes | Any | Search/list verified doctors |
| 20 | GET | `/doctors/:id` | Yes | Any | Get doctor public profile |
| 21 | GET | `/doctors/me` | Yes | DOCTOR | Get own doctor profile |
| 22 | PATCH | `/doctors/me` | Yes | DOCTOR | Update own doctor profile |
| 23 | GET | `/doctors/me/availability` | Yes | DOCTOR | Get own availability slots |
| 24 | POST | `/doctors/me/availability` | Yes | DOCTOR | Create availability slot(s) |
| 25 | DELETE | `/doctors/me/availability/:slotId` | Yes | DOCTOR | Delete availability slot |
| 26 | GET | `/doctors/me/appointments` | Yes | DOCTOR | List own appointments |
| 27 | GET | `/doctors/:id/availability` | Yes | Any | Get doctor's available slots |
| 28 | GET | `/volunteers/me` | Yes | VOLUNTEER | Get own volunteer profile |
| 29 | PATCH | `/volunteers/me` | Yes | VOLUNTEER | Update volunteer profile |
| 30 | GET | `/volunteers/me/tasks` | Yes | VOLUNTEER | List assigned/completed tasks |
| 31 | POST | `/family/accept-invite` | Yes | FAMILY_MEMBER | Accept invite code |
| 32 | GET | `/family/relationships` | Yes | FAMILY_MEMBER | List linked patients |
| 33 | GET | `/family/relationships/:id` | Yes | PATIENT, FAMILY_MEMBER | Get relationship details |
| 34 | PATCH | `/family/relationships/:id/revoke` | Yes | PATIENT | Revoke family access |
| 35 | GET | `/family/patients/:patientId/appointments` | Yes | FAMILY_MEMBER | View linked patient's appointments |
| 36 | GET | `/family/patients/:patientId/support-requests` | Yes | FAMILY_MEMBER | View linked patient's support requests |
| 37 | POST | `/family/patients/:patientId/support-requests` | Yes | FAMILY_MEMBER | Create support request for linked patient |
| 38 | POST | `/appointments` | Yes | PATIENT | Create appointment request |
| 39 | GET | `/appointments/:id` | Yes | PATIENT, DOCTOR, FAMILY_MEMBER, ADMIN | Get appointment details |
| 40 | PATCH | `/appointments/:id/confirm` | Yes | DOCTOR | Confirm appointment |
| 41 | PATCH | `/appointments/:id/reject` | Yes | DOCTOR | Reject appointment |
| 42 | PATCH | `/appointments/:id/cancel` | Yes | PATIENT, DOCTOR | Cancel appointment |
| 43 | PATCH | `/appointments/:id/complete` | Yes | DOCTOR | Mark appointment completed |
| 44 | PATCH | `/appointments/:id/no-show` | Yes | DOCTOR | Mark patient no-show |
| 45 | POST | `/support-requests` | Yes | PATIENT, FAMILY_MEMBER | Create support request |
| 46 | GET | `/support-requests` | Yes | VOLUNTEER | Browse open support requests |
| 47 | GET | `/support-requests/:id` | Yes | PATIENT, FAMILY_MEMBER, VOLUNTEER, ADMIN | Get request details |
| 48 | PATCH | `/support-requests/:id/accept` | Yes | VOLUNTEER | Accept (volunteer self-assigns) |
| 49 | PATCH | `/support-requests/:id/start` | Yes | VOLUNTEER | Mark in progress |
| 50 | PATCH | `/support-requests/:id/complete` | Yes | VOLUNTEER | Mark completed |
| 51 | PATCH | `/support-requests/:id/cancel` | Yes | PATIENT, FAMILY_MEMBER | Cancel request |
| 52 | GET | `/conversations` | Yes | Any | List own conversations |
| 53 | GET | `/conversations/:id` | Yes | Participant | Get conversation with recent messages |
| 54 | GET | `/conversations/:id/messages` | Yes | Participant | Get messages (cursor-paginated) |
| 55 | POST | `/conversations/:id/messages` | Yes | Participant | Send message |
| 56 | PATCH | `/conversations/:id/read` | Yes | Participant | Mark conversation as read |
| 57 | GET | `/notifications` | Yes | Any | List own notifications (paginated) |
| 58 | PATCH | `/notifications/:id/read` | Yes | Owner | Mark single notification read |
| 59 | PATCH | `/notifications/read-all` | Yes | Any | Mark all notifications read |
| 60 | GET | `/notifications/unread-count` | Yes | Any | Get unread count |
| 61 | GET | `/resources` | No | - | List published resources (public) |
| 62 | GET | `/resources/:id` | No | - | Get single published resource |
| 63 | POST | `/files/upload` | Yes | Any | Upload file |
| 64 | GET | `/files/:id` | Yes | Owner, ADMIN | Get file metadata |
| 65 | DELETE | `/files/:id` | Yes | Owner, ADMIN | Delete file |
| 66 | GET | `/admin/users` | Yes | ADMIN | List all users (paginated, filterable) |
| 67 | GET | `/admin/users/:id` | Yes | ADMIN | Get user details |
| 68 | PATCH | `/admin/users/:id/suspend` | Yes | ADMIN | Suspend user |
| 69 | PATCH | `/admin/users/:id/activate` | Yes | ADMIN | Reactivate user |
| 70 | GET | `/admin/verification-queue` | Yes | ADMIN | List pending verifications |
| 71 | PATCH | `/admin/users/:id/verify` | Yes | ADMIN | Approve doctor/volunteer verification |
| 72 | PATCH | `/admin/users/:id/reject-verification` | Yes | ADMIN | Reject verification |
| 73 | GET | `/admin/reports` | Yes | ADMIN | List abuse reports |
| 74 | PATCH | `/admin/reports/:id/review` | Yes | ADMIN | Review report |
| 75 | GET | `/admin/audit-logs` | Yes | ADMIN | Search audit logs |
| 76 | GET | `/admin/analytics` | Yes | ADMIN | Dashboard analytics |
| 77 | POST | `/admin/resources` | Yes | ADMIN | Create resource |
| 78 | PATCH | `/admin/resources/:id` | Yes | ADMIN | Update resource |
| 79 | DELETE | `/admin/resources/:id` | Yes | ADMIN | Archive resource |
| 80 | GET | `/health` | No | - | Health check |
| 81 | GET | `/health/ready` | No | - | Readiness check (DB connection) |
