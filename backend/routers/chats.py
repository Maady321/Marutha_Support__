# FastAPI utilities for building routes, WebSocket support, and handling disconnects
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
# SQLAlchemy Session for database operations
from sqlalchemy.orm import Session
# Standard Python libraries for typing
from typing import List, Dict

# Import local database, models, and schemas
from backend import database, models, schemas

# Initialize the router with a prefix '/chats' and tags for documentation
router = APIRouter(
    prefix="/chats",
    tags=["chats"]
)


# Class to manage active real-time connections (WebSockets)
class RealTimeConnectionHub:
    def __init__(self):
        # Dictionary mapping user IDs to their active chat window (WebSocket)
        self.online_users: Dict[int, WebSocket] = {}

    # Method to accept a new connection and store it
    async def log_user_in(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.online_users[user_id] = websocket

    # Method to remove a connection when a user closes their chat
    def log_user_out(self, user_id: int):
        if user_id in self.online_users:
            del self.online_users[user_id]

    # Method to send a message to a specific user if they are currently online
    async def send_direct_message(self, text_content: str, user_id: int):
        if user_id in self.online_users:
            await self.online_users[user_id].send_text(text_content)

# Global instance of the hub to be used by the WebSocket endpoint
chat_hub = RealTimeConnectionHub()

# Endpoint to send a new chat message (using the standard REST API)
@router.post("/", response_model=schemas.MessageReceived)
def send_new_message(incoming_data: schemas.MessageSent, database_session: Session = Depends(database.get_database_session), sender_id: int = 1):
    # Create a new message record in the database
    fresh_message = models.ChatMessage(
        sender_id=sender_id,
        recipient_id=incoming_data.recipient_id,
        message=incoming_data.message
    )
    database_session.add(fresh_message)
    database_session.commit()      # Save it to history
    database_session.refresh(fresh_message)

    return fresh_message

# Endpoint to fetch the conversation history between two users
@router.get("/history/{other_user_id}", response_model=List[schemas.MessageReceived])
def fetch_conversation_history(other_user_id: int, database_session: Session = Depends(database.get_database_session), current_user_id: int = 1):
    # Query messages where the logged-in user is either the sender OR the recipient
    conversation_history = database_session.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == current_user_id) & (models.ChatMessage.recipient_id == other_user_id)) |
        ((models.ChatMessage.sender_id == other_user_id) & (models.ChatMessage.recipient_id == current_user_id))
    ).order_by(models.ChatMessage.timestamp).all() # Sort by time
    return conversation_history

# WebSocket endpoint for real-time messaging
@router.websocket("/ws/{user_id}")
async def real_time_chat_endpoint(websocket: WebSocket, user_id: int):
    # Add the user to the list of active real-time users
    await chat_hub.log_user_in(websocket, user_id)
    try:
        while True:
            # Keep the connection alive and wait for messages
            incoming_text = await websocket.receive_text()
    except WebSocketDisconnect:
        # Clean up when the user leaves
        chat_hub.log_user_out(user_id)
