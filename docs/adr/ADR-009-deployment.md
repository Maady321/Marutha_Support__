# ADR-009: Deployment Strategy

## Status
Accepted

## Context
Need a deployment strategy suitable for an MVP healthcare platform.

## Decision
Vercel (frontend) + Railway (backend) + MongoDB Atlas (database).

## Alternatives Considered
- AWS (EC2/ECS — complex)
- Heroku (sunset concerns)
- Fly.io (good but less mature)
- Self-hosted VPS (operational burden)
- All-Vercel with serverless functions (limited for NestJS)

## Reason
Vercel is the best platform for Next.js deployment. Railway provides simple Docker-based Node.js hosting with fair pricing. MongoDB Atlas is the industry-standard managed MongoDB. All three have free/starter tiers suitable for MVP. Low operational overhead for a small team.

## Consequences
Multi-platform management (3 dashboards), potential migration if scaling needs change, Railway has usage-based pricing.
