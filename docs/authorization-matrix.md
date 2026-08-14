# Ashwasa: Authorization Matrix

This document defines the authorization and access control rules for the Ashwasa platform.

## 1. Role-Endpoint Authorization Matrix

| Endpoint | PATIENT | FAMILY | DOCTOR | VOLUNTEER | ADMIN | Notes |
|---|---|---|---|---|---|---|
| **Auth** | | | | | | |
| `POST /auth/register` | ○ | ○ | ○ | ○ | ✗ | ADMIN cannot self-register |
| `POST /auth/login` | ○ | ○ | ○ | ○ | ○ | Public |
| `POST /auth/logout` | ● | ● | ● | ● | ● | Requires valid session |
| `POST /auth/refresh` | ○ | ○ | ○ | ○ | ○ | Requires refresh token |
| `GET /auth/verify-email` | ○ | ○ | ○ | ○ | ○ | Public |
| `POST /auth/forgot-password` | ○ | ○ | ○ | ○ | ○ | Public |
| `POST /auth/reset-password` | ○ | ○ | ○ | ○ | ○ | Public |
| `GET /auth/me` | ● | ● | ● | ● | ● | Own data |
| **Users** | | | | | | |
| `GET /users` | ✗ | ✗ | ✗ | ✗ | ● | Admin only |
| `GET /users/:id` | ✗ | ✗ | ✗ | ✗ | ● | Admin only |
| `PATCH /users/me` | ● | ● | ● | ● | ● | Own user record |
| `PATCH /users/:id/status` | ✗ | ✗ | ✗ | ✗ | ● | Admin suspend/activate |
| **Patients** | | | | | | |
| `GET /patients` | ✗ | ✗ | ✗ | ✗ | ● | Admin only |
| `GET /patients/me` | ● | ✗ | ✗ | ✗ | ✗ | Patient profile |
| `PATCH /patients/me` | ● | ✗ | ✗ | ✗ | ✗ | Update profile |
| `GET /patients/:id` | ✗ | ● | ● | ● | ● | Verify relationship/assignment |
| **Family Members** | | | | | | |
| `GET /family-members/me`| ✗ | ● | ✗ | ✗ | ✗ | Profile |
| `POST /family-relationships`| ● | ✗ | ✗ | ✗ | ✗ | Patient invites |
| `PATCH /family-relationships/:id`| ● | ● | ✗ | ✗ | ✗ | Accept/Revoke |
| **Doctors** | | | | | | |
| `GET /doctors` | ● | ● | ● | ● | ● | Public directory |
| `GET /doctors/:id` | ● | ● | ● | ● | ● | Doctor details |
| `GET /doctors/me` | ✗ | ✗ | ● | ✗ | ✗ | Doctor profile |
| `PATCH /doctors/me` | ✗ | ✗ | ● | ✗ | ✗ | Update profile |
| `POST /doctors/me/availability`| ✗ | ✗ | ● | ✗ | ✗ | Availability management |
| **Volunteers** | | | | | | |
| `GET /volunteers` | ✗ | ✗ | ✗ | ✗ | ● | Admin directory |
| `GET /volunteers/me` | ✗ | ✗ | ✗ | ● | ✗ | Volunteer profile |
| `PATCH /volunteers/me` | ✗ | ✗ | ✗ | ● | ✗ | Update profile |
| **Appointments** | | | | | | |
| `GET /appointments` | ● | ● | ● | ✗ | ● | See resource rules |
| `POST /appointments` | ● | ✗ | ✗ | ✗ | ✗ | Patient books |
| `PATCH /appointments/:id`| ● | ✗ | ● | ✗ | ✗ | Cancel/Reschedule/Accept |
| **Support Requests** | | | | | | |
| `GET /support-requests` | ● | ● | ✗ | ● | ● | See resource rules |
| `POST /support-requests`| ● | ● | ✗ | ✗ | ✗ | Patient/Family creates |
| `PATCH /support-requests/:id`| ● | ● | ✗ | ● | ✗ | Update status/assignment |
| **Conversations** | | | | | | |
| `GET /conversations` | ● | ● | ● | ● | ✗ | User's conversations |
| `GET /conversations/:id` | ● | ● | ● | ● | ✗ | If participant |
| `POST /conversations/:id/messages`| ● | ● | ● | ● | ✗ | If participant |
| **Notifications** | | | | | | |
| `GET /notifications` | ● | ● | ● | ● | ● | Own notifications |
| `PATCH /notifications/:id/read`| ● | ● | ● | ● | ● | Mark as read |
| **Resources** | | | | | | |
| `GET /resources` | ● | ● | ● | ● | ● | Published only (unless admin) |
| `POST /resources` | ✗ | ✗ | ✗ | ✗ | ● | Create resource |
| `PATCH /resources/:id` | ✗ | ✗ | ✗ | ✗ | ● | Update resource |
| `DELETE /resources/:id` | ✗ | ✗ | ✗ | ✗ | ● | Delete resource |
| **Admin Reports** | | | | | | |
| `GET /reports/system` | ✗ | ✗ | ✗ | ✗ | ● | Admin stats |
| `POST /reports/abuse` | ● | ● | ● | ● | ✗ | Report issue |
| `GET /admin/verification-queue`| ✗ | ✗ | ✗ | ✗ | ● | View pending verifications |
| `PATCH /admin/verification/:id`| ✗ | ✗ | ✗ | ✗ | ● | Approve/Reject |

*(○ = no auth required, ● = allowed, ✗ = forbidden)*

## 2. Resource-Level Authorization Matrix

| Resource | PATIENT | FAMILY_MEMBER | DOCTOR | VOLUNTEER | ADMIN |
|---|---|---|---|---|---|
| **Own user profile** | CRUD | CRUD | CRUD | CRUD | Read + Manage |
| **Own role profile** | CRUD | - | CRUD | CRUD | Read + Manage |
| **Own appointments** | CRU | Read (linked) | RU | - | Read + Manage |
| **Own support requests**| CRU | CRU (linked) | - | Read (assigned) | Read + Manage |
| **Own conversations** | Read + Send | Read + Send (linked) | Read + Send | Read + Send | - |
| **Family relationships**| Create + Revoke | Accept + View | - | - | Read |
| **Doctor availability** | - | - | CRUD | - | Read |
| **Notifications** | Read | Read | Read | Read | Read (own) |
| **Resources** | Read (published) | Read (published) | Read (published) | Read (published) | CRUD |
| **Audit logs** | - | - | - | - | Read |
| **Reports** | Create | Create | Create | Create | Read + Review |
| **All users** | - | - | - | - | CRUD |
| **Verification queue** | - | - | - | - | Read + Update |

## 3. Object-Level Authorization Rules

For each resource, define ownership/relationship checks that are evaluated during the request processing:

| Resource | Check | Rule |
|---|---|---|
| **Appointment** | `patient_id = currentUser.id OR doctor_id = currentUser.id` | Direct ownership |
| **Appointment (family)** | `patient_id IN (SELECT patient_id FROM family_relationships WHERE family_member_id = currentUser.id AND status = 'ACTIVE')` | Relationship check |
| **Support Request** | `patient_id = currentUser.id OR created_by_id = currentUser.id OR volunteer_id = currentUser.id` | Direct ownership |
| **Support Request (family)** | `patient_id IN (linked patients)` | Relationship check |
| **Conversation** | `currentUser.id IN (SELECT user_id FROM conversation_participants WHERE conversation_id = :id)` | Participation check |
| **Family Relationship** | `patient_id = currentUser.id OR family_member_id = currentUser.id` | Either side |
| **File** | `uploaded_by = currentUser.id` | Owner check |
| **Notification** | `user_id = currentUser.id` | Owner check |

## 4. Verification Gate Rules

Certain roles require background checks or verification before they can perform specific actions in the system. The `verification_status` on their profile must be `VERIFIED`.

| Action | Requires Verified? | Error if Unverified |
|---|---|---|
| **Doctor: Accept appointments** | Yes | `FORBIDDEN_UNVERIFIED` |
| **Doctor: Set availability** | Yes | `FORBIDDEN_UNVERIFIED` |
| **Volunteer: Accept support requests** | Yes | `FORBIDDEN_UNVERIFIED` |
| **Doctor: View patient info** | Yes | `FORBIDDEN_UNVERIFIED` |
| **Patient: Book appointment** | No | - |
| **Patient: Create support request** | No | - |
