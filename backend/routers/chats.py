from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict

from backend import database, models, schemas

router = APIRouter(
    prefix="/chats",
    tags=["chats"]
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@router.post("/", response_model=schemas.ChatMessageResponse)
def send_message(data: schemas.ChatMessageCreate, db: Session = Depends(database.get_db), current_user_id: int = 1):
    msg = models.Chat(
        sender_id=current_user_id,
        recipient_id=data.recipient_id,
        message=data.message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    import asyncio

    return msg

@router.get("/history/{other_user_id}", response_model=List[schemas.ChatMessageResponse])
def get_history(other_user_id: int, db: Session = Depends(database.get_db), current_user_id: int = 1):
    msgs = db.query(models.Chat).filter(
        ((models.Chat.sender_id == current_user_id) & (models.Chat.recipient_id == other_user_id)) |
        ((models.Chat.sender_id == other_user_id) & (models.Chat.recipient_id == current_user_id))
    ).order_by(models.Chat.timestamp).all()
    return msgs

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
