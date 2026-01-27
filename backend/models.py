# SQLAlchemy components for defining table columns and relationships
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
# Standard Python libraries for time and enumerated types
from datetime import datetime
import enum
# Import the Base class from our database configuration
from backend.database import Base


# Enumeration for consultation request status
class ConsultationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


# 'UserAccount' table: Stores basic authentication and account info
class UserAccount(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)         # Primary ID
    email = Column(String, unique=True, index=True)            # Unique email for login
    hashed_password = Column(String)                           # Scrambled password
    role = Column(String)                                      # Role: 'patient', 'doctor', or 'volunteer'
    is_active = Column(Boolean, default=True)                  # Account status


# 'PatientProfile' table: Stores profile details for patients
class PatientProfile(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))          # Links to 'users' table
    name = Column(String)                                      # Full name
    age = Column(Integer)
    stage = Column(String)                                     # Disease stage (e.g., early, mid)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)     # Assigned doctor
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=True) # Assigned volunteer

    # Relationship to easily access user data from a patient object
    account = relationship("UserAccount")


# 'DoctorProfile' table: Stores profile details for doctors
class DoctorProfile(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))          # Links to 'users' table
    name = Column(String)
    specialty = Column(String)                                 # Medical specialty
    is_online = Column(Boolean, default=False)                 # Real-time availability status


# 'VolunteerProfile' table: Stores profile details for volunteers
class VolunteerProfile(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))          # Links to 'users' table
    name = Column(String)


# 'ChatMessage' table: Stores messages between users
class ChatMessage(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))        # Who sent the message
    recipient_id = Column(Integer, ForeignKey("users.id"))     # Who receives the message
    message = Column(String)                                   # The text content
    timestamp = Column(DateTime, default=datetime.utcnow)      # Time sent


# 'MedicalReport' table: Tracks uploaded medical documents
class MedicalReport(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))    # Which patient this belongs to
    title = Column(String)                                     # Name of the report
    file_path = Column(String)                                 # Path to the file on the server
    created_at = Column(DateTime, default=datetime.utcnow)     # Upload date


# 'DoctorRequest' table: Manages requests from patients to doctors
class DoctorRequest(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    status = Column(Enum(ConsultationStatus), default=ConsultationStatus.PENDING) # Status: pending/accepted
    appointment_time = Column(DateTime, nullable=True)         # Scheduled time
    notes = Column(String, nullable=True)                      # Additional info
    created_at = Column(DateTime, default=datetime.utcnow)     # Request date


# 'HealthLog' table: Stores health tracking data (vitals)
class HealthLog(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))    # Which patient these vitals describe
    pain_level = Column(Integer)                               # Level of pain (e.g., 1-10)
    mood = Column(String)                                      # Patient's current mood
    notes = Column(String, nullable=True)                      # Observations
    timestamp = Column(DateTime, default=datetime.utcnow)      # Time recorded
