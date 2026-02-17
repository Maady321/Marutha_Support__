from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime  # Import SQLAlchemy column types and constraints
from sqlalchemy.orm import relationship  # Import relationship for ORM linking
from datetime import datetime  # Import datetime for timestamp columns
from backend.database import Base  # Import the declarative Base

# Define the UserAccount model
class UserAccount(Base):
    __tablename__ = "users"  # Name of the table in the database
    id = Column(Integer, primary_key=True, index=True)  # Primary key, indexed for faster lookup
    email = Column(String, unique=True, index=True)  # User email, must be unique
    hashed_password = Column(String)  # Stored hashed password
    role = Column(String)  # Role of the user (e.g., patient, doctor, volunteer)
    is_active = Column(Boolean, default=True)  # Status of the user account
    token = Column(String, unique=True, index=True, nullable=True)  # Simple token for authentication

# Define the PatientProfile model
class PatientProfile(Base):
    __tablename__ = "patients"  # Table name for patient profiles
    id = Column(Integer, primary_key=True, index=True)  # Primary key
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key linking to the UserAccount table
    name = Column(String)  # Name of the patient
    age = Column(Integer)  # Age of the patient
    stage = Column(String)  # Disease stage
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)  # Foreign key linking to assigned doctor
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=True)  # Foreign key linking to assigned volunteer

# Define the DoctorProfile model
class DoctorProfile(Base):
    __tablename__ = "doctors"  # Table name for doctor profiles
    id = Column(Integer, primary_key=True, index=True)  # Primary key
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key linking to UserAccount
    name = Column(String)  # Name of the doctor
    specialty = Column(String)  # Doctor's specialty area
    is_online = Column(Boolean, default=False)  # Status indicating if the doctor is currently online

# Define the VolunteerProfile model
class VolunteerProfile(Base):
    __tablename__ = "volunteers"  # Table name for volunteer profiles
    id = Column(Integer, primary_key=True, index=True)  # Primary key
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key linking to UserAccount
    name = Column(String)  # Name of the volunteer

# Define the ChatMessage model
class ChatMessage(Base):
    __tablename__ = "chats"  # Table name for chat messages
    id = Column(Integer, primary_key=True, index=True)  # Primary key
    sender_id = Column(Integer, ForeignKey("users.id"))  # Foreign key for the sender
    recipient_id = Column(Integer, ForeignKey("users.id"))  # Foreign key for the recipient
    message = Column(String)  # Content of the message
    timestamp = Column(DateTime, default=datetime.utcnow)  # Time when the message was sent

# Define the MedicalReport model
class MedicalReport(Base):
    __tablename__ = "reports"  # Table name for medical reports
    id = Column(Integer, primary_key=True, index=True)  # Primary key
    patient_id = Column(Integer, ForeignKey("patients.id"))  # Foreign key linking to the patient
    title = Column(String)  # Title/Name of the report
    file_path = Column(String)  # Path where the file is stored
    created_at = Column(DateTime, default=datetime.utcnow)  # Time when the report was uploaded

# Define the DoctorRequest model (Consultations)
class DoctorRequest(Base):
    __tablename__ = "consultations"  # Table name for consultations
    id = Column(Integer, primary_key=True, index=True)  # Primary key
    patient_id = Column(Integer, ForeignKey("patients.id"))  # Foreign key linking to the patient
    doctor_id = Column(Integer, ForeignKey("doctors.id"))  # Foreign key linking to the doctor
    status = Column(String, default="pending")  # Status of the request (pending, accepted, etc.)
    appointment_time = Column(DateTime, nullable=True)  # Scheduled time for the appointment
    notes = Column(String, nullable=True)  # Optional notes
    created_at = Column(DateTime, default=datetime.utcnow)  # Time when the request was created
    
    patient = relationship("PatientProfile", lazy="joined")
    doctor = relationship("DoctorProfile", lazy="joined")

# Define the HealthLog model (Vitals)
class HealthLog(Base):
    __tablename__ = "vitals"  # Table name for health logs
    id = Column(Integer, primary_key=True, index=True)  # Primary key
    patient_id = Column(Integer, ForeignKey("patients.id"))  # Foreign key linking to the patient
    pain_level = Column(Integer)  # Recorded pain level
    mood = Column(String)  # Recorded mood
    notes = Column(String, nullable=True)  # Optional notes
    timestamp = Column(DateTime, default=datetime.utcnow)  # Time when the log was created
