from pydantic import BaseModel  # Import BaseModel to define data models
from typing import Optional, List  # Import type indicators for Optional fields and List types
from datetime import datetime  # Import datetime for timestamp fields

# Token model for authentication response
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

# Model for user registration input
class UserRegistration(BaseModel):
    email: str
    password: str
    role: str
    name: str # Added name

# Model for user login input
class UserLogin(BaseModel):
    email: str  # User's email address
    password: str  # User's password

# Model for returning user summary
class UserSummary(BaseModel):
    id: int  # Unique identifier for the user
    email: str  # User's email address
    role: str  # User's role
    class Config:
        from_attributes = True  # Enable ORM mode for Pydantic to read from SQLAlchemy models

# Base model for patient profile setup
class PatientProfileSetup(BaseModel):
    name: str  # Patient's name
    age: int  # Patient's age
    stage: str  # Stage of the patient (e.g., disease stage)

# Detailed patient model extending profile setup
class PatientDetails(PatientProfileSetup):
    id: int  # Unique identifier for the patient profile
    user_id: int  # ID of the user associated with this profile
    doctor_id: Optional[int]  # ID of the assigned doctor (optional)
    volunteer_id: Optional[int]  # ID of the assigned volunteer (optional)
    class Config:
        from_attributes = True  # Enable ORM mode

# Model for doctor details
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

# Model for volunteer details
class VolunteerDetails(BaseModel):
    id: Optional[int] = None  # Unique identifier for the volunteer profile
    user_id: Optional[int] = None  # ID of the user associated with this profile
    name: Optional[str] = None  # Volunteer's name
    class Config:
        from_attributes = True  # Enable ORM mode

# Model for sending a message
class MessageSent(BaseModel):
    recipient_id: int  # ID of the message recipient
    message: str  # Content of the message

# Model for receiving a message
class MessageReceived(BaseModel):
    id: int  # Unique identifier for the message
    sender_id: int  # ID of the message sender
    recipient_id: int  # ID of the message recipient
    message: str  # Content of the message
    timestamp: datetime  # Timestamp when the message was sent
    class Config:
        from_attributes = True  # Enable ORM mode

# Model for setting up a doctor request
class DoctorRequestSetup(BaseModel):
    doctor_id: int  # ID of the doctor being requested
    notes: Optional[str] = None  # Optional notes for the request
    appointment_time: Optional[datetime] = None  # Optional appointment time

class AcceptRequestPayload(BaseModel):
    appointment_time: datetime

# Detailed doctor request model
class DoctorRequestDetails(DoctorRequestSetup):
    id: int  # Unique identifier for the request
    patient_id: int  # ID of the patient making the request
    patient_name: Optional[str] = None
    patient_stage: Optional[str] = None
    doctor_name: Optional[str] = None
    patient_user_id: Optional[int] = None
    doctor_user_id: Optional[int] = None
    status: str  # Status of the request (e.g., pending, accepted)
    created_at: datetime  # Timestamp when the request was created
    class Config:
        from_attributes = True  # Enable ORM mode

# Base model for health log entry
class HealthLogEntry(BaseModel):
    pain_level: int  # Pain level reported by the patient
    mood: str  # Mood reported by the patient
    notes: Optional[str] = None  # Optional notes

# Detailed health log model
class HealthLogDetails(HealthLogEntry):
    id: int  # Unique identifier for the log entry
    patient_id: int  # ID of the patient who created the log
    timestamp: datetime  # Timestamp when the log was created
    class Config:
        from_attributes = True  # Enable ORM mode

# Model for medical report details
class MedicalReportDetails(BaseModel):
    id: int  # Unique identifier for the report
    title: str  # Title of the report
    file_path: str  # Path to the report file
    class Config:
        from_attributes = True  # Enable ORM mode

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

class ChatContact(BaseModel):
    user_id: int
    name: str
    role: str
    class Config:
        from_attributes = True

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
