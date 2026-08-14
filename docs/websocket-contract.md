# Ashwasa: WebSocket Contract

This document outlines the WebSocket integration for real-time features like messaging, presence, and notifications within Ashwasa.

## 1. Connection Protocol

- **Transport**: Socket.io over WebSocket.
- **URL**: `/ws` or same origin with Socket.io namespace.
- **Authentication**: JWT access token sent as a cookie (auto-included via browser) or via `auth.token` in the Socket.io handshake payload.
- **On Connect**: The server validates the JWT, extracts `userId` and `role`.
- **On Auth Failure**: The server immediately disconnects the socket and emits an `error` event.

## 2. Event Catalog

### Client → Server Events

| Event | Payload | Auth | Description |
|---|---|---|---|
| `conversation:join` | `{ conversationId: UUID }` | Participant check | Join conversation room to receive messages |
| `conversation:leave` | `{ conversationId: UUID }` | Participant | Leave conversation room |
| `message:send` | `{ conversationId: UUID, content: string }` | Participant + Active conversation | Send a chat message |
| `message:read` | `{ conversationId: UUID, messageId: UUID }` | Participant | Mark messages as read up to `messageId` |
| `typing:start` | `{ conversationId: UUID }` | Participant | Emit when user starts typing |
| `typing:stop` | `{ conversationId: UUID }` | Participant | Emit when user stops typing |

### Server → Client Events

| Event | Payload | Recipients | Description |
|---|---|---|---|
| `message:created` | `{ id, conversationId, senderId, senderName, content, status, createdAt }` | All conversation participants | New message received |
| `message:read` | `{ conversationId, readBy, readAt, lastReadMessageId }` | Conversation participants | Read receipt notification |
| `typing:start` | `{ conversationId, userId, userName }` | Other participants | Typing indicator started |
| `typing:stop` | `{ conversationId, userId }` | Other participants | Typing indicator stopped |
| `notification:created` | `{ id, type, title, body, linkedEntityType, linkedEntityId, createdAt }` | Target user | New notification pushed |
| `conversation:closed` | `{ conversationId, reason }` | All participants | Conversation closed (e.g. task completed) |
| `error` | `{ code, message }` | Sender | Error response for a failed operation |

## 3. Room Strategy

- Each conversation has a dedicated room: `conversation:{conversationId}`.
- Each user has a personal room automatically joined on connection: `user:{userId}` (used for system notifications).
- Users join conversation rooms explicitly via the `conversation:join` event.

## 4. Authorization

- **Connection**: A valid JWT is strictly required.
- **conversation:join**: The user must exist in the `conversation_participants` database table for the target ID, AND the conversation must have a status of `ACTIVE`.
- **message:send**: Passes the same checks as `join`. Additionally, content validation applies (max 5000 characters, cannot be empty).
- **All Events**: Server-side validation is strictly enforced; the client's payload is never inherently trusted.

## 5. Error Events

When an error occurs on a WebSocket operation, the server emits an `error` event with the following payload structure:

| Code | Message | When |
|---|---|---|
| `WS_AUTH_FAILED` | Authentication required | Invalid or expired JWT during connection or mid-session |
| `WS_CONVERSATION_NOT_FOUND` | Conversation not found | Invalid `conversationId` provided |
| `WS_CONVERSATION_FORBIDDEN` | Not a participant | User is not associated with the conversation |
| `WS_CONVERSATION_CLOSED` | Conversation is closed | Attempting to send a message to a closed/archived conversation |
| `WS_MESSAGE_INVALID` | Invalid message content | Empty content or exceeds character limits |
| `WS_RATE_LIMITED` | Too many messages | Exceeded rate limit (e.g., 30 messages/minute) |

## 6. Reconnection

- Clients use standard Socket.io auto-reconnect with exponential backoff.
- **On Reconnect**: The client must re-authenticate and re-join any active `conversation:{id}` rooms.
- **Missed Messages**: The WebSocket is purely a real-time event pipeline. Clients should fetch missing messages via REST (`GET /conversations/:id/messages?after=lastMessageId`) upon successful reconnection to reconcile state.

## 7. Offline Handling

- Messages sent while a recipient is disconnected are persisted safely in the PostgreSQL database.
- Unread messages are delivered via the REST API on the recipient's next app initialization/page load.
- Notification badges are updated via the `notification:created` event. If offline, the client can poll the REST endpoint (`GET /notifications/unread-count`) upon resuming.
