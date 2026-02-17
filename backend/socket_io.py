import socketio
from backend.database import SessionLocal
from backend.models import UserAccount
import logging

# Set up logging for Socket.io
logger = logging.getLogger("socketio")

# Create a Socket.io AsyncServer
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Wrap with an ASGI application
sio_app = socketio.ASGIApp(sio, socketio_path='/socket.io')

# Keep track of user IDs and their associated SIDs
user_sessions = {}

@sio.event
async def connect(sid, environ, auth):
    """
    Handle new Socket.io connections using simple token authentication.
    Expected auth: {'token': 'SIMPLE_TOKEN_STRING'}
    """
    if not auth or 'token' not in auth:
        logger.warning(f"Connection rejected: No auth token provided. SID: {sid}")
        return False

    token = auth.get('token')
    
    # We need a DB session to verify the token
    db = SessionLocal()
    try:
        # Search for user with this token
        user = db.query(UserAccount).filter(UserAccount.token == token).first()
        
        if user is None:
            logger.warning(f"Connection rejected: Invalid token. SID: {sid}")
            return False

        user_id = user.id

        # Store user_id in session for later access
        await sio.save_session(sid, {"user_id": user_id})
        
        # Register the SID to a room named after the user_id
        await sio.enter_room(sid, str(user_id))
        
        # Track active sessions
        if user_id not in user_sessions:
            user_sessions[user_id] = set()
        user_sessions[user_id].add(sid)
        
        logger.info(f"User {user_id} connected via simple token (SID: {sid})")
        return True
        
    except Exception as e:
        logger.error(f"Socket.io Auth error: {e}")
        return False
    finally:
        db.close()

@sio.event
async def disconnect(sid):
    """Handle Socket.io disconnections."""
    session = await sio.get_session(sid)
    if session:
        user_id = session.get("user_id")
        if user_id in user_sessions:
            user_sessions[user_id].discard(sid)
            if not user_sessions[user_id]:
                del user_sessions[user_id]
        logger.info(f"User {user_id} disconnected (SID: {sid})")

@sio.event
async def send_message(sid, data):
    """Handle client-side 'send_message' event."""
    session = await sio.get_session(sid)
    sender_id = session.get("user_id") if session else None
    
    if not sender_id:
        return

    recipient_id = data.get('recipient_id')
    message_text = data.get('message')

    payload = {
        "sender_id": sender_id,
        "recipient_id": recipient_id,
        "message": message_text,
        "timestamp": data.get('timestamp')
    }

    # Emit to the recipient's room
    await sio.emit('receive_message', payload, room=str(recipient_id))
    # Also emit back to the sender
    await sio.emit('receive_message', payload, room=str(sender_id))

async def broadcast_new_message(message_obj):
    """Utility function to broadcast a message created via HTTP API."""
    payload = {
        "id": message_obj.id,
        "sender_id": message_obj.sender_id,
        "recipient_id": message_obj.recipient_id,
        "message": message_obj.message,
        "timestamp": message_obj.timestamp.isoformat() if message_obj.timestamp else None
    }
    
    await sio.emit('receive_message', payload, room=str(message_obj.recipient_id))
    await sio.emit('receive_message', payload, room=str(message_obj.sender_id))
