# ADR-005: Authentication Strategy

## Status
Accepted

## Context
Need secure authentication for a healthcare-adjacent platform handling sensitive data.

## Decision
JWT-based authentication with HttpOnly Secure cookies, refresh token rotation.

## Alternatives Considered
- Session-based auth with server-side sessions (requires session store)
- OAuth2/OIDC only (complex for email/password)
- Firebase Auth (vendor lock-in)
- Passport.js session strategy

## Reason
JWT in HttpOnly cookies prevents XSS token theft. Refresh token rotation prevents replay attacks. Stateless access tokens enable horizontal scaling. Cookie-based auth is automatically included in requests (no client-side token management). Server-side refresh token storage enables session revocation.

## Consequences
Must implement refresh token rotation correctly, need CSRF protection for cookie-based auth, token expiry management.
