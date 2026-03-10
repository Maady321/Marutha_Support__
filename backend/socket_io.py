# socket_io.py - Real-time Chat Server using Socket.io
# This handles live messaging between users

import socketio
from database import SessionLocal
from models import UserAccount
import logging

# Setup logging
logger = logging.getLogger("socketio")

# Create the Socket.io server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*'  # Allow all for development to ensure connectivity
)

# Dictionary to track which users are connected
# Format: { user_id: set_of_socket_ids }
user_sessions = {}


@sio.event
async def connect(sid, environ, auth):
    """
    Called when a user connects to the chat.
    We verify their token to make sure they are logged in.
    """
    # Check if auth token was provided
    if not auth or 'token' not in auth:
        logger.warning("Connection rejected: No auth token. SID: " + str(sid))
        return False

    token = auth.get('token')

    # Open a database connection to verify the token
    db = SessionLocal()
    try:
        # Find the user with this token
        user = db.query(UserAccount).filter(UserAccount.token == token).first()

        if user is None:
            logger.warning("Connection rejected: Invalid token. SID: " + str(sid))
            return False

        user_id = user.id

        # Save the user's ID in this socket session
        await sio.save_session(sid, {"user_id": user_id})

        # Put the user in a "room" named after their ID
        # This makes it easy to send messages to specific users
        await sio.enter_room(sid, str(user_id))

        # Track this connection
        if user_id not in user_sessions:
            user_sessions[user_id] = set()
        user_sessions[user_id].add(sid)

        logger.info("User " + str(user_id) + " connected (SID: " + str(sid) + ")")
        print(f"--- Socket.io: User {user_id} connected (SID: {sid}) ---")
        return True

    except Exception as e:
        logger.error("Socket.io Auth error: " + str(e))
        print(f"--- Socket.io Auth Error: {e} ---")
        return False
    finally:
        db.close()


@sio.event
async def disconnect(sid):
    """Called when a user disconnects from the chat."""
    session = await sio.get_session(sid)
    if session:
        user_id = session.get("user_id")
        if user_id in user_sessions:
            user_sessions[user_id].discard(sid)
            # Remove the user entry if they have no more connections
            if len(user_sessions[user_id]) == 0:
                del user_sessions[user_id]
        logger.info("User " + str(user_id) + " disconnected (SID: " + str(sid) + ")")
        print(f"--- Socket.io: User {user_id} disconnected (SID: {sid}) ---")


@sio.event
async def send_message(sid, data):
    """Called when a user sends a chat message."""
    session = await sio.get_session(sid)

    sender_id = None
    if session:
        sender_id = session.get("user_id")

    if not sender_id:
        return

    recipient_id = data.get('recipient_id')
    message_text = data.get('message')

    # Build the message data to send
    payload = {
        "sender_id": sender_id,
        "recipient_id": recipient_id,
        "message": message_text,
        "timestamp": data.get('timestamp')
    }

    # Send the message to the recipient's room
    await sio.emit('receive_message', payload, room=str(recipient_id))
    # Also send it back to the sender (so they see their own message)
    await sio.emit('receive_message', payload, room=str(sender_id))


async def broadcast_new_message(message_obj):
    """
    Send a message to both sender and recipient.
    This is called when a message is created via the REST API.
    """
    payload = {
        "id": message_obj.id,
        "sender_id": message_obj.sender_id,
        "recipient_id": message_obj.recipient_id,
        "message": message_obj.message,
        "timestamp": None
    }

    # Convert timestamp to string if it exists
    if message_obj.timestamp:
        payload["timestamp"] = message_obj.timestamp.isoformat()

    print(f"--- Socket.io: Broadcasting message from {message_obj.sender_id} to {message_obj.recipient_id} ---")
    await sio.emit('receive_message', payload, room=str(message_obj.recipient_id))
    await sio.emit('receive_message', payload, room=str(message_obj.sender_id))
