from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks  # Import FastAPI components
from sqlalchemy.orm import Session  # Import Session for database operations
from typing import List  # Import type hintings
import database, models, schemas, auth  # Import backend modules
from socket_io import broadcast_new_message  # Import Socket.io broadcast utility

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

# Endpoint to get associated contacts for the current user
@chat_router.get("/contacts", response_model=List[schemas.ChatContact])
def get_chat_contacts(
    db: Session = Depends(database.get_database_session), 
    user: models.UserAccount = Depends(auth.fetch_logged_in_user)
):
    contacts_dict = {} # Use dict to ensure unique user_ids

    def add_contact(u_id, name, role):
        if u_id and u_id not in contacts_dict:
            contacts_dict[u_id] = schemas.ChatContact(user_id=u_id, name=name or f"User {u_id}", role=role)

    if user.role == "patient":
        patient = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == user.id).first()
        if patient:
            # Direct assignments
            if patient.doctor_id:
                doc = db.query(models.DoctorProfile).filter(models.DoctorProfile.id == patient.doctor_id).first()
                if doc: add_contact(doc.user_id, doc.name, "doctor")
            if patient.volunteer_id:
                vol = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.id == patient.volunteer_id).first()
                if vol: add_contact(vol.user_id, vol.name, "volunteer")
            
            # Accepted consultations
            consults = db.query(models.DoctorRequest).filter(
                models.DoctorRequest.patient_id == patient.id,
                models.DoctorRequest.status == "accepted"
            ).all()
            for c in consults:
                if c.doctor: add_contact(c.doctor.user_id, c.doctor.name, "doctor")

    elif user.role == "doctor":
        doc = db.query(models.DoctorProfile).filter(models.DoctorProfile.user_id == user.id).first()
        if doc:
            # Direct assignments
            patients = db.query(models.PatientProfile).filter(models.PatientProfile.doctor_id == doc.id).all()
            for p in patients: add_contact(p.user_id, p.name, "patient")
            
            # Accepted consultations
            consults = db.query(models.DoctorRequest).filter(
                models.DoctorRequest.doctor_id == doc.id,
                models.DoctorRequest.status == "accepted"
            ).all()
            for c in consults:
                if c.patient: add_contact(c.patient.user_id, c.patient.name, "patient")

    elif user.role == "volunteer":
        vol = db.query(models.VolunteerProfile).filter(models.VolunteerProfile.user_id == user.id).first()
        if vol:
            patients = db.query(models.PatientProfile).filter(models.PatientProfile.volunteer_id == vol.id).all()
            for p in patients: add_contact(p.user_id, p.name, "patient")
                    
    return list(contacts_dict.values())
