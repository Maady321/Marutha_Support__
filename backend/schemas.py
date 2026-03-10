# schemas.py - Data Validation Models
# These models define what data the API expects and returns
# Pydantic checks that the data matches these rules

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ---- Authentication Models ----

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class UserRegistration(BaseModel):
    email: str
    password: str
    role: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserSummary(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True


# ---- Patient Models ----

class PatientProfileSetup(BaseModel):
    name: str
    age: int
    stage: str


class PatientDetails(PatientProfileSetup):
    id: int
    user_id: int
    doctor_id: Optional[int] = None
    volunteer_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---- Doctor Models ----

class DoctorDetails(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    name: Optional[str] = None
    specialty: Optional[str] = "General"
    is_online: Optional[bool] = False
    experience: Optional[int] = None
    qualification: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    license_id: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Volunteer Models ----

class VolunteerDetails(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    name: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Chat Models ----

class MessageSent(BaseModel):
    recipient_id: int
    message: str


class MessageReceived(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatContact(BaseModel):
    user_id: int
    name: str
    role: str

    class Config:
        from_attributes = True


# ---- Consultation Request Models ----

class DoctorRequestSetup(BaseModel):
    doctor_id: int
    notes: Optional[str] = None
    appointment_time: Optional[datetime] = None


class AcceptRequestPayload(BaseModel):
    appointment_time: datetime


class DoctorRequestDetails(DoctorRequestSetup):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    patient_stage: Optional[str] = None
    doctor_name: Optional[str] = None
    patient_user_id: Optional[int] = None
    doctor_user_id: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Health Log Models ----

class HealthLogEntry(BaseModel):
    pain_level: int
    mood: str
    bp: Optional[str] = None
    heart_rate: Optional[int] = None
    notes: Optional[str] = None


class HealthLogDetails(HealthLogEntry):
    id: int
    patient_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


# ---- Medical Report Models ----

class MedicalReportDetails(BaseModel):
    id: int
    title: str
    file_path: str

    class Config:
        from_attributes = True


# ---- Medical Note Models ----

class MedicalNoteCreate(BaseModel):
    patient_id: int
    note_content: str


class MedicalNoteDetails(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    note_content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Prescription Models ----

class PrescriptionCreate(BaseModel):
    patient_id: int
    medication: str
    dosage: str
    instructions: Optional[str] = None


class PrescriptionDetails(BaseModel):
    id: int
    doctor_id: int
    patient_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    medication: str
    dosage: str
    instructions: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Volunteer Task Models ----

class VolunteerTaskCreate(BaseModel):
    task_name: str
    patient_name: Optional[str] = None


class VolunteerTaskDetails(BaseModel):
    id: int
    volunteer_id: int
    task_name: str
    patient_name: Optional[str] = None
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Volunteer Report Models ----

class VolunteerReportCreate(BaseModel):
    patient_name: str
    activity_type: str
    notes: Optional[str] = None


class VolunteerReportDetails(BaseModel):
    id: int
    volunteer_id: int
    patient_name: str
    activity_type: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Volunteer Time Log Models ----

class VolunteerTimeLogDetails(BaseModel):
    id: int
    volunteer_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int

    class Config:
        from_attributes = True



