# schemas.py - Data Validation Models
# These define the "rules" for what information can enter or leave our API.

# 1. WHAT: Pydantic Base Unit.
# EXPLAIN: BaseModel is the foundation for all data checks in FastAPI.
# QUESTION: Why do we need this?
# ANSWER: It automatically checks if a variable is a string or an integer, preventing bugs before they reach the database.
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ---- Authentication Models ----

# 2. WHAT: Secret Token Blueprint.
# EXPLAIN: Defines the format of the key given to users after they log in.
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


# 3. WHAT: Signup form rules.
# EXPLAIN: Specifies exactly what fields is needed to create a new user.
class UserRegistration(BaseModel):
    email: str
    password: str
    role: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


# 4. WHAT: Account Summary.
# EXPLAIN: A "clean" version of the user account that doesn't include the secret password.
# QUESTION: Why hide the password?
# ANSWER: Security - we should never send passwords back to the user's browser in an API response.
class UserSummary(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True


# ---- Patient Models ----

# 5. WHAT: Medical Profile Data.
class PatientProfileSetup(BaseModel):
    name: str
    age: int
    stage: str

class PatientDetails(BaseModel):
    id: int
    user_id: int
    name: str
    age: int
    stage: str
    doctor_id: Optional[int] = None
    volunteer_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---- Doctor Models ----

# 6. WHAT: Doctor Profile Data.
# EXPLAIN: Includes optional fields like bio/phone that the doctor can fill out later.
class DoctorDetails(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    specialty: Optional[str] = "General"
    is_online: Optional[bool] = False
    bio: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Consultation Request Models ----

# 7. WHAT: Appointment Request form.
# EXPLAIN: When a patient clicks "Book," this model ensures they provide the doctor_id and time.
class AcceptRequestPayload(BaseModel):
    appointment_time: datetime

class DoctorRequestSetup(BaseModel):
    doctor_id: int
    notes: Optional[str] = None
    appointment_time: datetime

class DoctorRequestDetails(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    status: str
    appointment_time: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    patient_user_id: Optional[int] = None
    patient_stage: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_user_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---- Health Log Models ----

# 8. WHAT: Vitals Tracker.
# EXPLAIN: Defines the structure for tracking pain, mood, and heart rate.
# QUESTION: Why are some fields Optional?
# ANSWER: A patient might want to log their mood every hour but only check their Blood Pressure once a day.
class HealthLogEntry(BaseModel):
    pain_level: int
    mood: str
    bp: Optional[str] = None
    heart_rate: Optional[int] = None
    sleep_hours: Optional[int] = None
    notes: Optional[str] = None

class HealthLogDetails(HealthLogEntry):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


# ---- Medical Report Models ----

class MedicalReportDetails(BaseModel):
    id: int
    patient_id: int
    title: str
    file_path: str
    created_at: datetime

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
    note_content: str
    created_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

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
    medication: str
    dosage: str
    instructions: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---- Volunteer Models ----

# 9. WHAT: Volunteer Task structure.
class VolunteerTaskCreate(BaseModel):
    task_name: str
    patient_name: Optional[str] = None

class VolunteerTaskDetails(BaseModel):
    id: int
    task_name: str
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class VolunteerDetails(BaseModel):
    id: int
    user_id: int
    name: str

    class Config:
        from_attributes = True

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

class VolunteerTimeLogDetails(BaseModel):
    id: int
    volunteer_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: int

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
