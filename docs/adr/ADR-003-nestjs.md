# ADR-003: NestJS Backend Framework

## Status
Accepted

## Context
Need a backend framework that enforces structure, supports TypeScript, and scales for a healthcare platform.

## Decision
NestJS 10 with TypeScript.

## Alternatives Considered
- Express (minimal structure)
- Fastify (fast but less opinionated)
- Hapi (smaller community)
- Django/Flask (Python — different language than frontend)

## Reason
NestJS provides modular architecture out of the box (perfect for modular monolith), built-in support for guards/interceptors/pipes (auth/validation), WebSocket support (messaging), excellent TypeScript support, large ecosystem.

## Consequences
Learning curve for decorators and DI patterns, heavier than Express but justified by structure benefits.
