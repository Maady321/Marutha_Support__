# Code Quality & Standards

## Linting
We use ESLint to enforce code quality rules across both Next.js and NestJS.
- **Run linter**: `pnpm run lint`
- **Rule set**: Strictest TypeScript checks enabled. No `any` types allowed without explicit disabling and justification.

## Formatting
We use Prettier to ensure consistent code styling.
- **Run formatter**: `pnpm run format`
- The Prettier configuration is centralized at the monorepo root (`.prettierrc`).

## TypeScript Strictness
All `tsconfig.json` files must extend the shared root config with `strict: true`, enforcing:
- `noImplicitAny`
- `strictNullChecks`
- `noUnusedLocals`

## Git Hooks
We use `husky` and `lint-staged` to prevent bad commits.
- Before committing, `lint-staged` will automatically run `prettier` on staged files.
- The CI pipeline will catch any type errors before merging.
