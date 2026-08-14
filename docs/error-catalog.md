# Error Catalog

This document outlines the standard error codes returned by the Ashwasa API. All error responses follow the standard format defined in the Backend Contract.

## 1. Authentication Errors (AUTH_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `401` | `AUTH_INVALID_CREDENTIALS` | Invalid email or password. | User provides incorrect login credentials. |
| `403` | `AUTH_EMAIL_NOT_VERIFIED` | Email address has not been verified. | User attempts to login before verifying their email address. |
| `403` | `AUTH_ACCOUNT_SUSPENDED` | Account has been suspended. Please contact support. | An admin has suspended the user's account. |
| `429` | `AUTH_ACCOUNT_LOCKED` | Account temporarily locked due to too many failed attempts. | Rate limit exceeded for login attempts. |
| `401` | `AUTH_TOKEN_EXPIRED` | Session expired. Please log in again. | The JWT access token has passed its expiration time. |
| `401` | `AUTH_TOKEN_INVALID` | Invalid authentication token. | The JWT is malformed, missing, or signed incorrectly. |
| `401` | `AUTH_REFRESH_TOKEN_INVALID`| Invalid or expired refresh token. | The refresh token provided in the cookie is invalid or expired. |
| `401` | `AUTH_REFRESH_TOKEN_REUSED` | Security alert: Token reuse detected. Please log in again. | A previously used refresh token was presented (indicates potential token theft). |
| `409` | `AUTH_EMAIL_ALREADY_EXISTS` | An account with this email already exists. | User tries to register with an email already in the DB. |
| `422` | `AUTH_WEAK_PASSWORD` | Password does not meet security requirements. | Password lacks required entropy, length, or complexity. |

## 2. Authorization Errors (FORBIDDEN_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `403` | `FORBIDDEN_ROLE` | You do not have permission to access this resource. | User's role does not match the `@Roles` guard requirements. |
| `403` | `FORBIDDEN_OWNERSHIP` | You do not have permission to modify this resource. | User attempts to update/delete an entity they do not own. |
| `403` | `FORBIDDEN_RELATIONSHIP` | You do not have permission to act on behalf of this patient. | Family member tries to access a patient not in their approved family list. |
| `403` | `FORBIDDEN_UNVERIFIED` | Your account is pending verification by an administrator. | Doctor or Volunteer attempts an action before admin approval. |

## 3. Validation Errors (VALIDATION_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `422` | `VALIDATION_FAILED` | Request validation failed. See details. | Payload fails DTO validation (includes a `details` array of specific field errors). |

## 4. Appointment Errors (APPOINTMENT_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `409` | `APPOINTMENT_CONFLICT` | You already have an appointment at this time. | Patient tries to book overlapping appointments for themselves. |
| `422` | `APPOINTMENT_INVALID_TRANSITION` | Cannot transition appointment from {current} to {target}. | Attempting an invalid state change (e.g., cancelling an already completed appointment). |
| `409` | `APPOINTMENT_SLOT_UNAVAILABLE` | The selected time slot is no longer available. | The doctor's slot was booked by someone else (concurrency conflict). |
| `422` | `APPOINTMENT_DOCTOR_NOT_VERIFIED`| Doctor profile is pending verification. | Trying to book a doctor who is not yet approved. |
| `422` | `APPOINTMENT_DOCTOR_NOT_ACCEPTING`| Doctor is not currently accepting new appointments. | Doctor has marked their schedule as inactive or fully booked. |

## 5. Support Request Errors (SUPPORT_REQUEST_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `409` | `SUPPORT_REQUEST_ALREADY_ASSIGNED`| This request has already been assigned to another volunteer. | Volunteer tries to claim a request that was just claimed by someone else. |
| `422` | `SUPPORT_REQUEST_INVALID_TRANSITION`| Cannot change request status from {current} to {target}. | Attempting an invalid state change (e.g., reopening a closed request incorrectly). |

## 6. Messaging Errors (CONVERSATION_* / MESSAGE_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `403` | `CONVERSATION_NOT_PARTICIPANT` | You are not a participant in this conversation. | User tries to view or send messages in a chat they don't belong to. |
| `422` | `CONVERSATION_CLOSED` | Cannot send messages to a closed conversation. | Trying to message in an archived/closed thread (e.g., completed support request). |
| `403` | `MESSAGE_UNAUTHORIZED` | You cannot modify this message. | User attempts to edit/delete a message sent by someone else. |

## 7. Family Relationship Errors (FAMILY_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `422` | `FAMILY_INVITE_EXPIRED` | This family invitation has expired. | User clicks a family link after the TTL has elapsed. |
| `404` | `FAMILY_INVITE_INVALID` | Invalid or missing invitation token. | Token does not exist in the database or is malformed. |
| `409` | `FAMILY_DUPLICATE_RELATIONSHIP` | A relationship with this user already exists. | Attempting to link a patient and family member who are already linked. |

## 8. File Upload Errors (FILE_*)

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `422` | `FILE_TOO_LARGE` | File exceeds the maximum allowed size of {size}MB. | Uploaded file size exceeds the defined limits. |
| `422` | `FILE_INVALID_TYPE` | File type is not allowed. Supported types: {types}. | Uploaded file MIME type is not in the allowed list (e.g., uploading an .exe). |
| `500` | `FILE_UPLOAD_FAILED` | An error occurred while saving the file. Please try again. | Cloudinary or local storage write failed. |

## 9. General Errors

| HTTP Status | Error Code | Message Template | When it Occurs |
|---|---|---|---|
| `404` | `RESOURCE_NOT_FOUND` | The requested resource could not be found. | Entity does not exist, or the user does not have permission to know it exists (IDOR prevention). |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests. Please try again later. | Global or endpoint-specific rate limits breached. |
| `500` | `INTERNAL_ERROR` | An unexpected internal error occurred. | Unhandled exceptions, DB connection failures, etc. |
