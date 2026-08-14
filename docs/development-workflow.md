# Development Workflow

## Git Strategy
We utilize a simplified branching strategy suitable for continuous integration:

- `main`: The primary stable branch. Deploys to staging/production.
- `feature/*`: Branch off `main` for new features (e.g., `feature/patient-dashboard`).
- `fix/*`: Branch off `main` for bug fixes (e.g., `fix/appointment-booking`).

## Pull Request Guidelines
1. **Branch Naming**: Use the conventions above.
2. **Commit Messages**: Write clear, descriptive commit messages.
3. **CI Checks**: All PRs must pass the GitHub Actions pipeline (Lint, Type check, Tests, Build).
4. **Code Review**: At least one approval is required before merging into `main`.
5. **No Direct Pushes**: Direct pushes to `main` are restricted.

## Architecture Guardrails
- **Frontend**: Components must not fetch directly from the DB. Use the service layers to call the API.
- **Backend**: Keep controllers thin. Business logic belongs in Application Services. Never leak sensitive data in DTOs.
- **Database**: Access is strictly managed by Prisma. No raw SQL queries without explicit architectural approval.
