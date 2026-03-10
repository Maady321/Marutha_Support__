# chats.py - Chat API Endpoints
# Handles sending messages, getting chat history, and finding contacts

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, auth
from socket_io import broadcast_new_message

# Create the chat router
chat_router = APIRouter(prefix="/chats", tags=["Chats"])


# ---- Send a Message ----
@chat_router.post("/", response_model=schemas.MessageReceived)
def send_message(
    data: schemas.MessageSent,
    tasks: BackgroundTasks,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(auth.fetch_logged_in_user)
):
    """Send a chat message to another user."""

    # Create a new message in the database
    new_msg = models.ChatMessage(
        sender_id=user.id,
        recipient_id=data.recipient_id,
        message=data.message
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    # Send the message in real-time via Socket.io (runs in background)
    tasks.add_task(broadcast_new_message, new_msg)

    return new_msg


# ---- Get Chat History ----
@chat_router.get("/history/{friend_id}", response_model=List[schemas.MessageReceived])
def get_chat_history(
    friend_id: int,
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(auth.fetch_logged_in_user)
):
    """Get all messages between the current user and another user."""

    # Find messages where:
    # - Current user sent to friend, OR
    # - Friend sent to current user
    messages = db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == user.id) & (models.ChatMessage.recipient_id == friend_id)) |
        ((models.ChatMessage.sender_id == friend_id) & (models.ChatMessage.recipient_id == user.id))
    ).order_by(models.ChatMessage.timestamp).all()

    return messages


# ---- Get Chat Contacts ----
@chat_router.get("/contacts", response_model=List[schemas.ChatContact])
def get_chat_contacts(
    db: Session = Depends(database.get_database_session),
    user: models.UserAccount = Depends(auth.fetch_logged_in_user)
):
    """Get the list of people the current user can chat with."""

    # Use a dictionary to avoid duplicate contacts
    contacts_dict = {}

    def add_contact(user_id, name, role):
        """Helper function to add a contact if not already in the list."""
        if user_id and user_id not in contacts_dict:
            if not name:
                name = "User " + str(user_id)
            contacts_dict[user_id] = schemas.ChatContact(
                user_id=user_id,
                name=name,
                role=role
            )

    # ---- Patient contacts ----
    if user.role == "patient":
        patient = db.query(models.PatientProfile).filter_by(user_id=user.id).first()
        if patient:
            # 1. Add doctor(s) from accepted consultations
            consults = db.query(models.DoctorRequest).filter(
                models.DoctorRequest.patient_id == patient.id,
                models.DoctorRequest.status == "accepted"
            ).all()
            for c in consults:
                if c.doctor:
                    add_contact(c.doctor.user_id, c.doctor.name, "doctor")
            
            # 2. Add assigned volunteer
            if patient.volunteer:
                add_contact(patient.volunteer.user_id, patient.volunteer.name, "volunteer")

    # ---- Doctor contacts ----
    elif user.role == "doctor":
        doc = db.query(models.DoctorProfile).filter_by(user_id=user.id).first()
        if doc:
            # 1. Add all other doctors (professional network)
            all_other_docs = db.query(models.DoctorProfile).filter(models.DoctorProfile.id != doc.id).all()
            for d in all_other_docs:
                add_contact(d.user_id, d.name, "doctor")
            
            # 2. Add all patients with accepted consultations
            consults = db.query(models.DoctorRequest).filter(
                models.DoctorRequest.doctor_id == doc.id,
                models.DoctorRequest.status == "accepted"
            ).all()
            for c in consults:
                if c.patient:
                    add_contact(c.patient.user_id, c.patient.name, "patient")
                    
                    # 3. Add the volunteer assigned to that patient
                    if c.patient.volunteer:
                        add_contact(c.patient.volunteer.user_id, c.patient.volunteer.name, "volunteer")
            
            # 4. Also add all volunteers who are in the system (Helpful for doctor coordination)
            all_vols = db.query(models.VolunteerProfile).all()
            for v in all_vols:
                add_contact(v.user_id, v.name, "volunteer")

    # ---- Volunteer contacts ----
    elif user.role == "volunteer":
        vol = db.query(models.VolunteerProfile).filter_by(user_id=user.id).first()
        if vol:
            # 1. Add all Doctors in the system (So they can reach out for help)
            all_docs = db.query(models.DoctorProfile).all()
            for d in all_docs:
                add_contact(d.user_id, d.name, "doctor")
            
            # 2. Add all assigned patients
            patients = db.query(models.PatientProfile).filter_by(volunteer_id=vol.id).all()
            for p in patients:
                add_contact(p.user_id, p.name, "patient")

    # Convert dictionary values to a list and return
    return list(contacts_dict.values())
