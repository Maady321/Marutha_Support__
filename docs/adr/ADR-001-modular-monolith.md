# ADR-001: Modular Monolith

## Status
Accepted

## Context
Need to choose between microservices, monolith, or modular monolith for a small team building an MVP.

## Decision
Modular monolith with NestJS modules.

## Alternatives Considered
- Pure monolith (no module boundaries)
- Microservices (too complex for MVP)
- Serverless functions (vendor lock-in, cold starts)

## Reason
Module boundaries enforce separation of concerns while keeping deployment simple. Can extract to microservices later if needed. Small team can iterate fast.

## Consequences
Single deployment unit, module boundaries enforced by NestJS DI system, easier debugging, shared database.
