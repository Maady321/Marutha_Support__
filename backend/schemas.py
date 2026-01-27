# Pydantic's BaseModel for data validation and settings management
from pydantic import BaseModel
# Standard Python libraries for type hinting and time
from typing import Optional, List
from datetime import datetime


# Schema for returning an authentication token to the user
class Token(BaseModel):
    access_token: str                                         # The actual JWT string
    token_type: str                                           # Typically 'bearer'


# Schema for internal token data (extracted from the JWT)
class TokenData(BaseModel):
    username: Optional[str] = None                             # Usually the user's email


# Schema for creating a new user (Data coming from the frontend during signup)
class UserRegistration(BaseModel):
    email: str
    password: str
    role: str                                                  # patient, doctor, or volunteer


# Schema for sending a quick overview of a user back to the frontend
class UserSummary(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True                                # Allows reading data from SQLAlchemy models


# Schema for setting up a new patient profile
class PatientProfileSetup(BaseModel):
    name: str
    age: int
    stage: str


# Schema for sending full patient details back
class PatientDetails(PatientProfileSetup):
    id: int
    user_id: int
    doctor_id: Optional[int]
    volunteer_id: Optional[int]
    user: Optional[UserSummary] = None                        # Nested user account info

    class Config:
        from_attributes = True


# Schema for setting up a new doctor profile
class DoctorProfileSetup(BaseModel):
    name: str
    specialty: str


# Schema for sending full doctor details back
class DoctorDetails(DoctorProfileSetup):
    id: int
    user_id: int
    is_online: bool

    class Config:
        from_attributes = True


# Schema for sending volunteer profile details back
class VolunteerDetails(BaseModel):
    id: int
    user_id: int
    name: str

    class Config:
        from_attributes = True


# Schema for when a user sends a new chat message
class MessageSent(BaseModel):
    recipient_id: int
    message: str


# Schema for when the system sends back a received chat message
class MessageReceived(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


# Schema for a patient to request a consultation with a doctor
class DoctorRequestSetup(BaseModel):
    doctor_id: int
    notes: Optional[str] = None
    appointment_time: Optional[datetime] = None


# Schema for sending details about a doctor request back
class DoctorRequestDetails(DoctorRequestSetup):
    id: int
    patient_id: int
    status: str                                               # pending, accepted, rejected
    created_at: datetime

    class Config:
        from_attributes = True


# Schema for updating the status of a request (e.g., doctor accepting it)
class DoctorRequestUpdate(BaseModel):
    status: str


# Schema for sending details of an uploaded medical report
class MedicalReportDetails(BaseModel):
    id: int
    title: str
    file_path: str
    created_at: datetime
    patient_id: int

    class Config:
        from_attributes = True


# Schema for creating a new health log entry (like a daily check-in)
class HealthLogEntry(BaseModel):
    pain_level: int
    mood: str
    notes: Optional[str] = None


# Schema for sending health log details back (includes ID and time)
class HealthLogDetails(HealthLogEntry):
    id: int
    patient_id: int
    timestamp: datetime

    class Config:
        from_attributes = True
