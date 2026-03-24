# backend/models.py - Database Table Definitions
# This file defines the structure of the data stored in the database.

# 1. WHAT: Imports SQLAlchemy column types and constraints.
# EXPLAIN: Column defines a table field; Integer, String, etc., define the type of data.
# QUESTION: What is a ForeignKey?
# ANSWER: It creates a link between two tables (e.g., linking a Patient to a specific User).
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime

# 2. WHAT: Imports the relationship function.
# EXPLAIN: This allows SQLAlchemy models to easily access related data (e.g., patient.volunteer).
from sqlalchemy.orm import relationship

# 3. WHAT: Imports datetime and timezone.
# EXPLAIN: Used to store when reports or logs were created.
from datetime import datetime, timezone

# 4. WHAT: Imports the Base class from our database connection file.
# EXPLAIN: All classes here must inherit from Base to be recognized by SQLAlchemy.
from database import Base


# ---- User Account Table ----
# 5. WHAT: Defines the UserAccount class.
# EXPLAIN: This table handles authentication (email, password, role).
# QUESTION: Why is email unique?
# ANSWER: To prevent two people from registering with the exact same email address.
class UserAccount(Base):
    __tablename__ = "users" # The name of the table in the actual database

    id = Column(Integer, primary_key=True, index=True) # Unique ID for each system user
    email = Column(String, unique=True, index=True)   # User's login email
    hashed_password = Column(String)                   # Security-encrypted version of the password
    role = Column(String)                              # Defines if user is "patient", "doctor", or "volunteer"
    is_active = Column(Boolean, default=True)          # Allows disabling accounts without deleting them
    token = Column(String, unique=True, index=True, nullable=True) # Temporary login session token


# ---- Patient Profile Table ----
# 6. WHAT: Defines the PatientProfile class.
# EXPLAIN: Stores medical-specific details for users with the "patient" role.
class PatientProfile(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Links to the main UserAccount
    name = Column(String)                             # Patient's full name
    age = Column(Integer)                             # Patient's age
    stage = Column(String)                            # Medical stage (e.g., Stage 1, Recovery)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True) # Assigned doctor
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=True) # Assigned volunteer

    volunteer = relationship("VolunteerProfile", lazy="joined") # Automatically fetch volunteer info


# ---- Doctor Profile Table ----
# 7. WHAT: Defines the DoctorProfile class.
# EXPLAIN: Stores professional details for users with the "doctor" role.
class DoctorProfile(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    specialty = Column(String)         # Medical field (e.g., Palliative Care)
    is_online = Column(Boolean, default=False)
    experience = Column(Integer, nullable=True)
    qualification = Column(String, nullable=True)
    bio = Column(String, nullable=True) # Short professional description
    phone = Column(String, nullable=True)
    license_id = Column(String, nullable=True)


# ---- Volunteer Profile Table ----
# 8. WHAT: Defines the VolunteerProfile class.
# EXPLAIN: Stores basic details for users who provide volunteer support.
class VolunteerProfile(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)


# ---- Chat Messages Table ----
# 9. WHAT: Defines the ChatMessage class.
# EXPLAIN: Stores the history of all messages sent in the app.
class ChatMessage(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id")) # Person who sent the message
    recipient_id = Column(Integer, ForeignKey("users.id")) # Person who receives it
    message = Column(String) # The text content of the message
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---- Medical Reports Table ----
# 10. WHAT: Defines the MedicalReport class.
# EXPLAIN: Tracks uploaded PDF or image files for medical records.
class MedicalReport(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id")) # Whose report this is
    title = Column(String)                       # Name of the document
    file_path = Column(String)                   # Location of the file on the server
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---- Consultation Requests Table ----
# 11. WHAT: Defines the DoctorRequest class.
# EXPLAIN: Manages appointment requests between patients and doctors.
class DoctorRequest(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    status = Column(String, default="pending") # Status like "pending", "approved", "completed"
    appointment_time = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", lazy="joined")
    doctor = relationship("DoctorProfile", lazy="joined")


# ---- Health Logs Table (Vitals) ----
# 12. WHAT: Defines the HealthLog class.
# EXPLAIN: Stores patient-reported data like pain and vitals.
class HealthLog(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    pain_level = Column(Integer) # Scale of 1-10
    mood = Column(String)        # Patient's current emotional state
    bp = Column(String, nullable=True) # Blood Pressure reading
    heart_rate = Column(Integer, nullable=True)
    sleep_hours = Column(Integer, nullable=True) # Hours of sleep
    notes = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---- Medical Notes Table ----
# 13. WHAT: Defines the MedicalNote class.
# EXPLAIN: Clinical observations written by doctors about patients.
class MedicalNote(Base):
    __tablename__ = "medical_notes"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    note_content = Column(String)  # The doctor's professional observation
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", lazy="joined")
    doctor = relationship("DoctorProfile", lazy="joined")


# ---- Prescriptions Table ----
# 14. WHAT: Defines the Prescription class.
# EXPLAIN: Official medication records issued by doctors.
class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    medication = Column(String)   # Name of the drug
    dosage = Column(String)       # Amount (e.g., 500mg)
    instructions = Column(String, nullable=True) # How to take it
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", lazy="joined")
    doctor = relationship("DoctorProfile", lazy="joined")


# ---- Volunteer Tasks Table ----
# 15. WHAT: Defines the VolunteerTask class.
# EXPLAIN: Specific jobs assigned to volunteers (e.g., "Visit Patient").
class VolunteerTask(Base):
    __tablename__ = "volunteer_tasks"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    patient_name = Column(String, nullable=True)
    task_name = Column(String)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    volunteer = relationship("VolunteerProfile", lazy="joined")


# ---- Volunteer Reports Table ----
# 16. WHAT: Defines the VolunteerReport class.
# EXPLAIN: Feedback and updates provided by volunteers after completing tasks.
class VolunteerReport(Base):
    __tablename__ = "volunteer_reports"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    patient_name = Column(String)
    activity_type = Column(String) # E.g., "Home Visit", "Phone Call"
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    volunteer = relationship("VolunteerProfile", lazy="joined")


# ---- Volunteer Time Logs Table ----
# 17. WHAT: Defines the VolunteerTimeLog class.
# EXPLAIN: Tracks the working hours/shifts for each volunteer.
class VolunteerTimeLog(Base):
    __tablename__ = "volunteer_time_logs"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    start_time = Column(DateTime, default=datetime.now) # Time they clocked in
    end_time = Column(DateTime, nullable=True)        # Time they clocked out
    duration_minutes = Column(Integer, default=0)    # Total duration of the shift

    volunteer = relationship("VolunteerProfile", lazy="joined")
