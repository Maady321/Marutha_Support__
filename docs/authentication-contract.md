# Ashwasa: Authentication Contract

This document outlines the authentication architecture and contract for the Ashwasa platform. 

## 1. Authentication Strategy

- **Access Token**: JWT, 15 minute expiry, stored in `HttpOnly` + `Secure` + `SameSite=Strict` cookie named `access_token`.
- **Refresh Token**: Opaque token (generated via `crypto.randomBytes`), 7 day expiry, stored hashed (SHA-256) in `users.refresh_token_hash`, sent in `HttpOnly` + `Secure` + `SameSite=Strict` cookie named `refresh_token`, path restricted to `/api/v1/auth/refresh`.
- **Password Hashing**: `bcrypt` with cost factor 12.
- **CSRF Protection**: Double-submit cookie pattern. The server sets a `csrf_token` cookie (not HttpOnly), and the client reads it and sends it via the `X-CSRF-Token` header on state-changing requests (POST, PUT, PATCH, DELETE).

## 2. Registration Flow

**Note**: The `ADMIN` role cannot be self-registered. Admin accounts must be provisioned via a secure script or by an existing Super Admin.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB as Database
    participant Email as Email Service
    
    Client->>Server: POST /auth/register (email, password, firstName, lastName, role)
    Server->>Server: Validate input payload
    Server->>DB: Check email uniqueness
    alt Email exists
        Server-->>Client: 409 Conflict
    else Email available
        Server->>Server: Hash password (bcrypt)
        Server->>DB: Create user (status=PENDING_VERIFICATION)
        Server->>DB: Create role-specific profile (Patient/Doctor/Volunteer)
        Server->>Server: Generate email verification token (crypto.randomBytes, 24h expiry)
        Server->>Email: Send verification email
        Server->>DB: Create audit log (REGISTER)
        Server-->>Client: 201 Created { data: { id, email, role, accountStatus } }
    end
```

## 3. Email Verification Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB as Database
    
    Client->>Server: GET /auth/verify-email?token=xxx
    Server->>DB: Find user by verification token
    alt Token Invalid/Expired
        Server-->>Client: 400 Bad Request
    else Token Valid
        Server->>DB: Check token not expired
        Server->>DB: Set email_verified=true, account_status=ACTIVE
        Server->>DB: Clear verification token
        Server->>DB: For DOCTOR/VOLUNTEER: set verification_status=PENDING
        Server->>DB: Create audit log
        Server-->>Client: 200 OK
    end
```

## 4. Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB as Database
    
    Client->>Server: POST /auth/login (email, password)
    Server->>DB: Find user by email
    alt User Not Found or Suspended/Deleted/Pending
        Server-->>Client: 401/403 Error
    else Valid User Status
        Server->>DB: Check lockout_until
        alt Locked Out
            Server-->>Client: 403 Forbidden (Locked out)
        else
            Server->>Server: Compare password with bcrypt
            alt Password Incorrect
                Server->>DB: Increment failed_login_attempts
                Server->>DB: Check threshold (5), set lockout_until if exceeded
                Server-->>Client: 401 Unauthorized
            else Password Correct
                Server->>DB: Reset failed_login_attempts
                Server->>Server: Generate access token JWT ({ sub, role, email })
                Server->>Server: Generate refresh token (opaque)
                Server->>Server: Hash refresh token
                Server->>DB: Store refresh_token_hash, Update last_login_at
                Server->>DB: Create audit log (LOGIN)
                Server-->>Client: 200 OK + Set-Cookie(access_token, refresh_token, csrf_token)
            end
        end
    end
```

## 5. Token Refresh Flow

Refresh token rotation: Every refresh generates a new pair. Old refresh token is immediately invalidated. If a previously-invalidated refresh token is used (reuse detection), ALL refresh tokens for that user are revoked.

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB as Database
    
    Client->>Server: POST /auth/refresh (Cookies: refresh_token)
    Server->>Server: Extract refresh token from cookie
    Server->>Server: Hash it
    Server->>DB: Find matching user in DB
    alt Not Found
        Server->>DB: Possible token theft → clear all tokens for suspected user (if known)
        Server->>DB: Create audit log (TOKEN_REUSE_DETECTED)
        Server-->>Client: 401 Unauthorized
    else Found
        Server->>Server: Check expiry
        alt Expired
            Server-->>Client: 401 Unauthorized
        else Valid
            Server->>Server: Generate NEW access token + NEW refresh token (rotation)
            Server->>Server: Hash NEW refresh token
            Server->>DB: Invalidate old refresh token hash, store new one
            Server-->>Client: 200 OK + Set-Cookie(NEW access_token, NEW refresh_token)
        end
    end
```

## 6. Logout Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB as Database
    
    Client->>Server: POST /auth/logout
    Server->>DB: Clear refresh_token_hash in DB
    Server->>Server: Clear all auth cookies (Max-Age=0)
    Server->>DB: Create audit log (LOGOUT)
    Server-->>Client: 204 No Content
```

## 7. Password Reset Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB as Database
    participant Email as Email Service
    
    Client->>Server: POST /auth/forgot-password (email)
    Server->>DB: Find user (always return 200 to prevent enumeration)
    Server->>Server: Generate reset token (crypto.randomBytes, 1h expiry)
    Server->>DB: Store hashed reset token + expiry
    Server->>Email: Send reset email
    Server-->>Client: 200 OK { message: "If email exists, reset link sent" }
    
    Client->>Server: POST /auth/reset-password (token, newPassword)
    Server->>DB: Find user by hashed reset token
    Server->>Server: Check token not expired
    Server->>Server: Hash new password
    Server->>DB: Update password, Clear reset token
    Server->>DB: Revoke all refresh tokens
    Server->>DB: Create audit log (PASSWORD_CHANGED)
    Server-->>Client: 200 OK
```

## 8. Account Lockout

- After 5 failed login attempts: lockout for 15 minutes.
- Lockout is per-account (not IP-based).
- Lockout counter resets on successful login.
- Failed attempts logged to audit log.

## 9. Session Revocation

- **Logout**: clears the specific refresh token.
- **Password Change**: revokes all sessions (clears refresh tokens).
- **Admin Suspend**: revokes all sessions.
- **Refresh Token Reuse Detection**: triggers full revocation to protect against session hijacking.

## 10. Cookie Configuration

| Cookie | HttpOnly | Secure | SameSite | Path | Max-Age |
|---|---|---|---|---|---|
| `access_token` | Yes | Yes | Strict | `/` | 900 (15 min) |
| `refresh_token` | Yes | Yes | Strict | `/api/v1/auth/refresh` | 604800 (7 days) |
| `csrf_token` | No | Yes | Strict | `/` | 604800 (7 days) |

## 11. JWT Payload

The JWT payload is minimal to reduce payload size and avoid transmitting sensitive data. Role is included for fast Guard checks but is verified against the DB for critical/destructive operations.

```json
{
  "sub": "user-uuid",
  "role": "PATIENT",
  "email": "user@example.com",
  "iat": 1690000000,
  "exp": 1690000900
}
```
