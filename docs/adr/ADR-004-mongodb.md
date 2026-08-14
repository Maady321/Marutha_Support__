# ADR-004: Database Selection (Revised)

## Status
**Superseded** — Original decision (MongoDB) replaced with PostgreSQL after Step 3 deep data modeling analysis.

## Context
The Step 2 architecture proposed MongoDB based on schema flexibility and document-model fit. During Step 3 (Database & Domain Model Design), a thorough evaluation of the actual data relationships, state machines, referential integrity needs, and healthcare-adjacent nature of the platform revealed that a relational database is objectively the stronger choice.

See `docs/database-decision.md` for the full evaluation.

## Decision
**PostgreSQL 16** via **Prisma ORM**, hosted on Supabase, Neon, or Railway Postgres.

## Alternatives Considered
- **MongoDB 7 on Atlas** (original choice) — Rejected due to lack of database-level referential integrity, weaker transaction model for concurrent operations (double-booking prevention, atomic task assignment), and reliance on application-level validation for state machines.
- **MySQL** — Viable but PostgreSQL has superior feature set (CTEs, JSONB, full-text search, array types, CHECK constraints).
- **SQLite** — Not suitable for a production multi-user platform.
- **Firebase/Firestore** — Vendor lock-in, limited query capabilities.

## Reason
- Database-enforced foreign keys prevent orphaned records across 16 related tables.
- CHECK constraints and ENUM types enforce valid states at the database level.
- UNIQUE constraints with conditions prevent double-booking and duplicate assignments atomically.
- ACID transactions are first-class and battle-tested for concurrent operations.
- SQL is superior for admin analytics and reporting (GROUP BY, window functions, CTEs).
- Prisma provides type-safe schema with auto-generated migrations and excellent NestJS/TypeScript integration.
- The data model is well-defined (not schema-flexible) — this is a data integrity problem, not a schema flexibility problem.

## Consequences
- Schema changes require Prisma migrations (managed, versioned, reproducible).
- No native horizontal sharding (acceptable for MVP scale of 10,000 users).
- Team needs SQL knowledge (widely available).
- Deployment architecture updated: Supabase/Neon/Railway Postgres replaces MongoDB Atlas.
- Previous `data-architecture.md` (MongoDB-based) is superseded by `database-design.md` (PostgreSQL-based).
