# models.py - Database Table Definitions
# Each class below represents a table in the database

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


# ---- User Account Table ----
# Stores login information for all users (patients, doctors, volunteers)
class UserAccount(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)              # "patient", "doctor", or "volunteer"
    is_active = Column(Boolean, default=True)
    token = Column(String, unique=True, index=True, nullable=True)


# ---- Patient Profile Table ----
# Stores extra information about patients
class PatientProfile(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    age = Column(Integer)
    stage = Column(String)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"), nullable=True)

    volunteer = relationship("VolunteerProfile", lazy="joined")


# ---- Doctor Profile Table ----
# Stores extra information about doctors
class DoctorProfile(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    specialty = Column(String)
    is_online = Column(Boolean, default=False)
    experience = Column(Integer, nullable=True)
    qualification = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    license_id = Column(String, nullable=True)


# ---- Volunteer Profile Table ----
# Stores extra information about volunteers
class VolunteerProfile(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)


# ---- Chat Messages Table ----
# Stores all chat messages between users
class ChatMessage(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---- Medical Reports Table ----
# Stores uploaded medical report files
class MedicalReport(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    title = Column(String)
    file_path = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---- Consultation Requests Table ----
# Stores requests from patients to doctors
class DoctorRequest(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    status = Column(String, default="pending")
    appointment_time = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", lazy="joined")
    doctor = relationship("DoctorProfile", lazy="joined")


# ---- Health Logs Table (Vitals) ----
# Stores daily health entries from patients
class HealthLog(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    pain_level = Column(Integer)
    mood = Column(String)
    bp = Column(String, nullable=True) # Blood Pressure (e.g. 120/80)
    heart_rate = Column(Integer, nullable=True) # Heart Rate (bpm)
    notes = Column(String, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---- Medical Notes Table ----
# Stores clinical notes written by doctors
class MedicalNote(Base):
    __tablename__ = "medical_notes"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    note_content = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", lazy="joined")
    doctor = relationship("DoctorProfile", lazy="joined")


# ---- Prescriptions Table ----
# Stores prescriptions written by doctors
class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    medication = Column(String)
    dosage = Column(String)
    instructions = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("PatientProfile", lazy="joined")
    doctor = relationship("DoctorProfile", lazy="joined")


# ---- Volunteer Tasks Table ----
# Stores tasks assigned to volunteers
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
# Stores activity reports submitted by volunteers
class VolunteerReport(Base):
    __tablename__ = "volunteer_reports"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    patient_name = Column(String)
    activity_type = Column(String)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    volunteer = relationship("VolunteerProfile", lazy="joined")


# ---- Volunteer Time Logs Table ----
# Tracks shift hours for volunteers
class VolunteerTimeLog(Base):
    __tablename__ = "volunteer_time_logs"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)

    volunteer = relationship("VolunteerProfile", lazy="joined")
