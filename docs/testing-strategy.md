# Testing Strategy

We follow a balanced testing pyramid approach to ensure stability without slowing down development.

## Unit Testing
- **Frontend (Next.js)**: `Vitest` + `Testing Library` for complex React hooks and utilities.
- **Backend (NestJS)**: `Jest` for unit testing Domain Services, Authorization Guards, and Custom Pipes.
- **Goal**: Cover pure business logic and complex transformations. We do not aim for 100% coverage on boilerplate controllers.

## Integration Testing
- **Backend API Tests**: Verify that the endpoints match the API Contract (Step 4). We use Supertest coupled with a test database to ensure route responses and validation logic are correct.

## End-to-End (E2E) Testing
- **Tool**: `Playwright`
- **Scope**: Critical user flows only:
  - Authentication (Login/Logout)
  - Patient Booking Flow
  - Doctor Availability Setup
- **Execution**: Run in CI environments against a staging-like database.

## Running Tests
To run all tests across the monorepo:
```bash
pnpm test
```
