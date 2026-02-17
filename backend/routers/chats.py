from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks  # Import FastAPI components
from sqlalchemy.orm import Session  # Import Session for database operations
from typing import List  # Import type hintings
from backend import database, models, schemas, auth  # Import backend modules
from backend.socket_io import broadcast_new_message  # Import Socket.io broadcast utility

# Initialize the routers
chat_router = APIRouter(prefix="/chats", tags=["Chats"])

# Endpoint to send a new chat message
@chat_router.post("/", response_model=schemas.MessageReceived)
def send_message(
    data: schemas.MessageSent,  # Message content and recipient
    tasks: BackgroundTasks,  # Background tasks for async operations
    db: Session = Depends(database.get_database_session), 
    user: models.UserAccount = Depends(auth.fetch_logged_in_user)  # Authenticated user
):
    # Create a new chat message record
    new_msg = models.ChatMessage(
        sender_id=user.id,
        recipient_id=data.recipient_id,
        message=data.message
    )
    db.add(new_msg)  # Add to session
    db.commit()  # Commit to DB
    db.refresh(new_msg)  # Refresh with DB data

    # Schedule the message delivery via Socket.io as a background task
    tasks.add_task(broadcast_new_message, new_msg)

    return new_msg  # Return stored message

# Endpoint to retrieve chat history between two users
@chat_router.get("/history/{friend_id}", response_model=List[schemas.MessageReceived])
def get_chat_history(
    friend_id: int, 
    db: Session = Depends(database.get_database_session), 
    user: models.UserAccount = Depends(auth.fetch_logged_in_user)
):
    # Query messages sent or received by the current user with the friend
    return db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == user.id) & (models.ChatMessage.recipient_id == friend_id)) |
        ((models.ChatMessage.sender_id == friend_id) & (models.ChatMessage.recipient_id == user.id))
    ).order_by(models.ChatMessage.timestamp).all()  # Order by timestamp
