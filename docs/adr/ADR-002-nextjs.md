# ADR-002: Next.js Frontend Framework

## Status
Accepted

## Context
Need a frontend framework that supports SSR/SSG, TypeScript, file-based routing, and is production-ready.

## Decision
Next.js 15 with App Router.

## Alternatives Considered
- Vite + React (no SSR out of box)
- Remix (smaller ecosystem)
- Angular (overkill for this team)
- Vue/Nuxt (team expertise is React)

## Reason
App Router provides Server Components (performance), file-based routing (DX), middleware (auth), ISR (content caching). Vercel deployment is seamless. Largest React ecosystem.

## Consequences
Tied to React ecosystem, Vercel-optimized but not locked in, learning curve for Server Components vs Client Components.
