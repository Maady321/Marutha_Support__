# Database Evaluation for Ashwasa

This document details the evaluation and final decision for the primary database technology for Ashwasa, a healthcare support coordination platform.

## 1. Database Evaluation: MongoDB vs PostgreSQL

The platform has 5 roles (PATIENT, FAMILY_MEMBER, DOCTOR, VOLUNTEER, ADMIN) and features including Auth, Profiles, Family linking, Appointments, Support Requests, Contextual Messaging, Notifications, Admin Verification, Audit Logs, File metadata, Resources, and Reports.

| Criterion | MongoDB | PostgreSQL | Winner |
|---|---|---|---|
| User relationships | References via ObjectId, no FK enforcement | Native foreign keys, cascade, referential integrity | PostgreSQL |
| Patient/family relationships | Flexible embedded arrays or references, no FK | Proper join tables with FK constraints | PostgreSQL |
| Doctor appointments | Document-based, good for reads | Relational joins, strong for conflict detection via constraints | PostgreSQL |
| Volunteer assignments | Status-based queries work well with both | Constraints prevent double-assignment atomically | PostgreSQL |
| Messaging (high-write) | Excellent write throughput, flexible schema | Good but slightly more overhead on high-write append patterns | MongoDB |
| Notifications | Append-heavy, read-by-user, natural fit for document | Works fine but slightly more verbose | MongoDB |
| Audit logs (append-only, immutable) | Excellent for append-only workloads | Works fine | Tie |
| Transactions | Multi-document transactions since 4.0 (but limited vs SQL) | ACID transactions are first-class, battle-tested | PostgreSQL |
| Referential integrity | Application-level only (Mongoose refs are not enforced by DB) | Database-enforced foreign keys, cascades, constraints | PostgreSQL |
| Query complexity | Simple queries excellent; complex joins require `$lookup` (slower) | Complex joins, subqueries, CTEs are first-class | PostgreSQL |
| Reporting & analytics | Aggregation pipeline is powerful but verbose | SQL `GROUP BY`, window functions, CTEs are more natural | PostgreSQL |
| Future scalability | Horizontal scaling (sharding) is built-in | Vertical scaling primary; horizontal via read replicas or Citus | MongoDB (slight edge) |
| Development complexity (Mongoose vs Prisma/TypeORM) | Mongoose is mature; schema validation at app level | Prisma/TypeORM provide type-safe DB schemas with migration support | Tie |
| Schema flexibility | Excellent for evolving MVP schemas | Requires migrations for schema changes | MongoDB (slight edge for MVP iteration) |
| Portfolio/industry value | Popular for MERN/MEAN stacks | Industry standard for production systems, healthcare, fintech | PostgreSQL |
| NestJS integration | `@nestjs/mongoose`, well-supported | `@nestjs/typeorm` or Prisma, excellent support | Tie |
| Managed hosting cost | MongoDB Atlas free tier (M0) | Supabase/Neon free tier, Railway Postgres | Tie |

## 2. Critical Analysis

While MongoDB is a popular and powerful NoSQL database, the specific requirements of the Ashwasa platform present several challenges when using a document database:

1. **Referential integrity**: This platform has many cross-entity relationships (patient → appointment → doctor, patient → family_relationship → family_member, support_request → volunteer, conversation → appointment). MongoDB does NOT enforce FK constraints at the database level. All integrity must be maintained by application code. This is a real risk for a healthcare-adjacent platform where orphaned records or broken relationships can lead to poor patient outcomes or confusion.
2. **Transactions**: Appointments require conflict detection (e.g., no double-booking a doctor). Support request assignment requires atomicity (only one volunteer can claim a request at a time). While MongoDB supports multi-document transactions, they are less mature and more complex to manage effectively compared to PostgreSQL's battle-tested ACID transactions.
3. **State machines**: Multiple entities have complex state machines (User verification, Appointment status, SupportRequest status, FamilyRelationship status). PostgreSQL `CHECK` constraints can enforce valid states and transitions at the database level. MongoDB relies entirely on application-level validation.
4. **Reporting**: Admin analytics (such as appointment completion rates, volunteer activity metrics, and request fulfillment times) are much more natural and performant with SQL. Aggregation pipelines in MongoDB can become very verbose and complex for relational data reporting.
5. **Data consistency**: Healthcare-adjacent platforms fundamentally benefit from strong consistency guarantees and strict data models over eventual consistency and schema flexibility.

## 3. Final Recommendation

Based on this thorough evaluation, **PostgreSQL is recommended** as the primary database for Ashwasa.

- **Reasoning vs Previous Architecture**: The initial architecture documents proposed MongoDB. However, upon deeper analysis of the actual data relationships, state machines, referential integrity needs, and the healthcare-adjacent nature of the platform, PostgreSQL is objectively the stronger choice. 
- **Data Integrity Focus**: This is NOT a schema-flexibility problem; the core entities and their relationships are well-defined. It IS a data-integrity problem.
- **Tooling ecosystem**: PostgreSQL combined with Prisma ORM provides type-safe schemas, auto-generated migrations, and excellent integration with NestJS.
- **Hosting Alternatives**: The originally planned MongoDB Atlas can be easily replaced with Supabase (which offers a free tier PostgreSQL + auth + storage) or Neon (serverless PostgreSQL).
- **Product Specification Alignment**: This decision does NOT contradict the product specification, which does not mandate a specific database technology. This evaluation explicitly supersedes the earlier architecture document's recommendation with documented, rigorous reasoning.

## 4. Updated ADR

### ADR-004 (Revised): PostgreSQL over MongoDB

**Status**: Accepted (supersedes original ADR-004)

**Context**: 
The Step 2 architecture proposed MongoDB. However, Step 3 deep data modeling revealed that the platform's relationship-heavy, state-machine-driven, and integrity-critical nature is much better served by a relational database.

**Decision**: 
Use PostgreSQL (via Prisma ORM) hosted on Supabase, Neon, or Railway.

**Alternatives Considered**:
- MongoDB (original choice) — rejected due to lack of database-level referential integrity.
- MySQL — viable, but PostgreSQL has a superior feature set (CTEs, JSONB support, full-text search) for this specific application.
- SQLite — not suitable for a production multi-user platform of this scale.

**Reason**:
- Database-enforced foreign keys prevent orphaned records and maintain complex relationship graphs.
- `CHECK` constraints enforce valid state transitions.
- `UNIQUE` constraints with conditions prevent double-booking and concurrent assignment conflicts.
- ACID transactions are first-class for concurrent operations.
- SQL is vastly superior for the planned admin analytics and reporting features.
- Prisma provides a type-safe schema with robust auto-migration generation.

**Consequences**:
- Need to update deployment architecture (target Supabase/Neon/Railway Postgres instead of MongoDB Atlas).
- Schema changes will require formal migrations (managed seamlessly by Prisma).
- No native horizontal sharding out of the box (entirely acceptable for MVP and early growth scale).
- Team needs SQL/relational database knowledge (which is widely available).

## 5. Technology Stack Update

The updated data layer technology stack is as follows:

- **Database**: PostgreSQL 16 (hosted on Supabase, Neon, or Railway)
- **ORM**: Prisma (providing type-safety, auto-migrations, and excellent TypeScript support)
- **NestJS integration**: `@prisma/client` utilized via a custom `PrismaService` module
