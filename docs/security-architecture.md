# Ashwasa - Security Architecture

## 1. Security Overview

The Ashwasa platform handles health-adjacent data (appointments, patient-doctor messages, verification documents) and coordinates support between various roles: PATIENT, FAMILY_MEMBER, DOCTOR, VOLUNTEER, and ADMIN. While it is NOT an Electronic Health Record (EHR) system, it requires a robust security posture.

Our security strategy is built on the following core principles:
- **Defense-in-Depth Approach**: Implementing security controls at multiple layers (network, application, database) to ensure that if one layer fails, others provide protection.
- **Principle of Least Privilege**: Users and system components are granted only the minimum level of access required to perform their functions.
- **Security by Default**: Systems and features are designed to be secure out-of-the-box, without requiring users to opt-in to security features.

---

## 2. Healthcare Data Security

### Data Classification
- **PUBLIC**: Doctor public profiles, resource articles, publicly accessible support information.
- **INTERNAL**: User profiles, appointment metadata, support request descriptions.
- **CONFIDENTIAL**: Patient-Doctor messages, consultation notes, verification documents.
- **RESTRICTED**: Passwords (hashed), refresh tokens, CSRF tokens, encryption keys.

### Data Minimization
- Collect minimum data to provide the service.
- **No EHR data**, no lab results, no diagnostic images.
- **No payment data** (offload to a PCI-DSS compliant third-party provider if ever needed).

### Data Protection Controls
- **Encryption in Transit**: TLS 1.2+ mandatory for all connections.
- **Encryption at Rest**: MongoDB Atlas encryption at rest (AES-256).
- **Sensitive Field Handling**: Never log passwords, tokens, or message content.
- **Secure Logging**: Redact PII (Personally Identifiable Information) from application logs.
- **File Security**: Private files accessed via signed URLs, strict MIME type validation, and file size limits.

### Data Retention
- **Active Accounts**: Data retained while the account is active.
- **Deleted Accounts**: Soft delete implemented; PII anonymized after 30 days, audit logs retained.
- **Unverified Accounts**: Purged completely after 30 days.
- **Verification Documents**: Retained while the account is active, deleted upon account deletion.
- **Messages**: Retained while conversation participants are active.

### Data Export
- Users can request an export of their data (supporting future GDPR readiness).

### Backup Security
- MongoDB Atlas automated backups (encrypted).
- Point-in-time recovery enabled.

---

## 3. Authentication Security

- **Tokens**: JWT access tokens stored in `HttpOnly` `Secure` `SameSite=Strict` cookies (15-minute expiry).
- **Refresh Tokens**: Refresh token rotation with a 7-day expiry. Stored hashed in the database.
- **Passwords**: Bcrypt password hashing (cost factor 12).
- **Complexity**: Minimum 8 character passwords with complexity requirements.
- **Verification**: Email verification required before granting full access to the platform.
- **Account Lockout**: 5 failed login attempts result in a 15-minute account lock.
- **Rate Limiting**: 5 login attempts per minute, 3 password resets per hour.
- **CSRF Protection**: Implemented using the Double-Submit Cookie pattern or a custom header requirement.

---

## 4. Authorization Security

- **Server-Side RBAC**: Role-Based Access Control implemented via NestJS Guards.
- **Object-Level Authorization**: Ownership checks enforced on all resource access (e.g., users can only view their own appointments).
- **Frontend Guards**: Frontend route guards are implemented for UX convenience only and are **NOT** relied upon for security.
- **Access Patterns**: Specific access patterns enforced per role (refer to the permissions matrix from the product spec).
- **Contextual Access**: Messaging functionality is only unlocked contextually (e.g., via an active task or appointment).

---

## 5. Threat Model

| Threat | Attack Surface | Impact | Likelihood | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Account Takeover** | Authentication endpoints (Login) | High | Medium | Rate limiting, account lockout on brute force/credential stuffing, strong password policies. |
| **Broken Access Control** | API Endpoints | High | Medium | Strict ownership guards, comprehensive server-side RBAC checks. |
| **IDOR (Insecure Direct Object Reference)** | URL Parameters / API Payloads | High | Medium | Validate resource ownership on every request server-side. |
| **Privilege Escalation** | JWT / Request Payloads | High | Low | Roles stored server-side; JWT role claims verified against the database. |
| **XSS (Cross-Site Scripting)** | Messages / User Profiles | High | Medium | Input sanitization, strong CSP headers, React auto-escaping. |
| **CSRF (Cross-Site Request Forgery)** | State-changing API endpoints | High | Low | `SameSite` cookies, CSRF tokens (Double-Submit). |
| **NoSQL Injection** | MongoDB Queries via API inputs | High | Low | Input validation, parameterized queries, strict Mongoose schema validation. |
| **Malicious File Uploads** | File Upload Endpoints | High | Medium | MIME type validation, file size limits, content-type checking, no direct execution of uploaded files. |
| **Rate-Limit Bypass** | API Endpoints | Medium | Low | Combination of IP-based and user-based rate limiting. |
| **Session Theft** | Cookies | High | Low | `HttpOnly`, `Secure`, `SameSite` flags, short expiry for access tokens. |
| **Data Leakage** | API Responses / Logs | High | Medium | Field-level response filtering, strict log redaction for PII. |
| **Message Abuse** | Messaging System | Medium | Medium | Contextual messaging (unlocked only for active tasks), reporting mechanism, moderation capabilities. |
| **Fake Doctor/Volunteer Accounts** | Registration / Profile | High | Low | Mandatory admin verification, rigorous credential checks. |
| **Data Scraping** | Public/Internal APIs | Low | Medium | Rate limiting, authentication required for sensitive data, pagination limits. |

---

## 6. Security Headers

The following security headers must be enforced on all HTTP responses:
- `Content-Security-Policy` (CSP): Restricts sources of executable scripts.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
- `X-Frame-Options: DENY`: Prevents clickjacking.
- `X-XSS-Protection: 0`: Rely on modern CSP instead.
- `Strict-Transport-Security` (HSTS): Enforces HTTPS connections.
- `Referrer-Policy: strict-origin-when-cross-origin`: Protects referral information.
- `Permissions-Policy`: Restricts access to browser features (camera, microphone, etc.).

---

## 7. Input Validation

- **Backend Validation**: `class-validator` decorators on all Data Transfer Objects (DTOs).
- **Frontend Validation**: `Zod` schemas utilized on all forms.
- **Database Layer Validation**: Strict Mongoose schema validation rules.
- **Sanitization**: Sanitize HTML in all text fields to prevent XSS.
- **File Validation**: Validate all file uploads for correct MIME type, size, and content structure.

---

## 8. Audit Logging

- **What is Logged**: All admin actions, authentication events, verification decisions, account suspensions, and data access to sensitive resources.
- **Format**: `{ action, userId, targetId, targetType, details, ipAddress, timestamp }`
- **Storage**: Stored in a dedicated, isolated `AuditLog` MongoDB collection.
- **Retention**: Permanent (never deleted).
- **Access**: Admin only, strictly read-only (no edit or delete operations permitted on audit logs).

---

## 9. Incident Response

- **Detection**: Proactively monitor failed authentication attempts, rate limit triggers, and unusual data access patterns.
- **Response**: Automated account freezes, forced password resets, and immediate admin notifications for suspicious activities.
- **Recovery**: Thorough audit log reviews and timely notification of affected users in the event of an incident.

---

## 10. Compliance Readiness

- **Current Status**: The platform is **NOT** currently claiming formal HIPAA or GDPR compliance.
- **Architecture Goal**: The architecture implements robust technical controls that support a smooth future compliance assessment.
- **Key Controls Implemented**: Data encryption, strict access control, comprehensive audit logging, data minimization, defined retention policies, and support for the right to deletion (data export/erasure).
