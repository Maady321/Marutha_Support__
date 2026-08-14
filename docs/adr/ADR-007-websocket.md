# ADR-007: WebSocket Communication

## Status
Accepted

## Context
Messaging requires real-time or near-real-time delivery.

## Decision
Socket.io for WebSocket communication.

## Alternatives Considered
- Native WebSockets (no fallback)
- Server-Sent Events (one-directional)
- Long polling (higher latency)
- Pusher/Ably (third-party cost)

## Reason
Socket.io provides automatic fallback to long-polling if WebSocket fails, built-in reconnection logic, room-based messaging (maps to conversations), NestJS has first-class Socket.io support via @nestjs/platform-socket.io. Self-hosted avoids third-party costs.

## Consequences
Need to handle horizontal scaling (Redis adapter when scaling beyond 1 instance), additional connection management, must authenticate WebSocket connections.
