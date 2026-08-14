# Development Setup

Follow these instructions to get the Ashwasa platform running locally.

## Prerequisites
- **Node.js**: v20 LTS
- **pnpm**: >= 9.0.0
- **PostgreSQL**: v16 (Local or via Docker)

## Installation

1. Clone the repository and navigate into it.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Fill in the required `.env` values (especially the `DATABASE_URL`).

## Starting the Application

You can start both the frontend and backend concurrently from the root directory:

```bash
pnpm run dev
```

Alternatively, you can run them individually:
- **Frontend**: `pnpm --filter web dev` (Starts on http://localhost:3000)
- **Backend**: `pnpm --filter api dev` (Starts on http://localhost:3001)

## Architecture Overview
This is a `pnpm` monorepo containing:
- `apps/web`: Next.js frontend (App Router)
- `apps/api`: NestJS backend
- `packages/*`: Shared UI components, configuration, and types.
