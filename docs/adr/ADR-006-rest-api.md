# ADR-006: RESTful API

## Status
Accepted

## Context
Need to choose an API paradigm for client-server communication.

## Decision
RESTful API with versioning (/api/v1/).

## Alternatives Considered
- GraphQL (flexible queries but added complexity)
- gRPC (not browser-friendly)
- tRPC (TypeScript-only, tight coupling)

## Reason
REST is well-understood, easy to document (Swagger/OpenAPI), works with any client (web, mobile, third-party), cacheable, stateless. The data access patterns are predictable enough that GraphQL's flexibility isn't needed.

## Consequences
Potential over-fetching/under-fetching (acceptable for MVP), need clear API versioning strategy.
