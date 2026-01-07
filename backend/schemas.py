from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class PatientCreate(BaseModel):
    name: str
    age: int
    stage: str


class PatientResponse(PatientCreate):
    id: int
    user_id: int
    doctor_id: Optional[int]
    volunteer_id: Optional[int]
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class DoctorCreate(BaseModel):
    name: str
    specialty: str


class DoctorResponse(DoctorCreate):
    id: int
    user_id: int
    is_online: bool

    class Config:
        from_attributes = True


class VolunteerResponse(BaseModel):
    id: int
    user_id: int
    name: str

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    recipient_id: int
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ConsultationCreate(BaseModel):
    doctor_id: int
    notes: Optional[str] = None
    appointment_time: Optional[datetime] = None


class ConsultationResponse(ConsultationCreate):
    id: int
    patient_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConsultationUpdate(BaseModel):
    status: str


class ReportResponse(BaseModel):
    id: int
    title: str
    file_path: str
    created_at: datetime
    patient_id: int

    class Config:
        from_attributes = True


class VitalLogCreate(BaseModel):
    pain_level: int
    mood: str
    notes: Optional[str] = None


class VitalLogResponse(VitalLogCreate):
    id: int
    patient_id: int
    timestamp: datetime

    class Config:
        from_attributes = True
