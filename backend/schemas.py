import re
import uuid
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.models import Role, AccountStatus, VerificationStatus, FamilyRelationshipStatus, CaregiverPermission, TimelineEventType, CarePlanStatus, ClinicalRoleContext, ServiceRequestType, ServiceRequestStatus

# Password validation helper
def check_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', v):
        raise ValueError("Password must contain at least one number")
    return v

class RegisterSchema(BaseModel):
    email: EmailStr
    password: str
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    role: Role

    @field_validator("password")
    @classmethod
    def validate_password_field(cls, v: str) -> str:
        return check_password(v)

    @field_validator("role")
    @classmethod
    def validate_role_field(cls, v: Role) -> Role:
        if v == Role.ADMIN:
            raise ValueError("Cannot register as an ADMIN")
        return v

class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class ResetPasswordSchema(BaseModel):
    token: str = Field(..., min_length=1)
    newPassword: str

    @field_validator("newPassword")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return check_password(v)

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class VerifyEmailSchema(BaseModel):
    token: str = Field(..., min_length=1)

class UpdateUserSchema(BaseModel):
    firstName: Optional[str] = Field(None, max_length=100)
    lastName: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, max_length=100)
    zipCode: Optional[str] = Field(None, max_length=20)
    avatarUrl: Optional[str] = Field(None)

class UpdatePatientProfileSchema(BaseModel):
    dateOfBirth: Optional[str] = None  # Received as YYYY-MM-DD string, converted to date in endpoint
    gender: Optional[str] = Field(None, max_length=20)
    medicalNotes: Optional[str] = None
    emergencyContactName: Optional[str] = Field(None, max_length=100)
    emergencyContactPhone: Optional[str] = Field(None, max_length=20)
    emergencyContactRelationship: Optional[str] = Field(None, max_length=50)

class UpdateDoctorProfileSchema(BaseModel):
    specialty: Optional[str] = Field(None, max_length=100)
    licenseNumber: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    qualifications: Optional[str] = None
    hospital: Optional[str] = Field(None, max_length=200)
    yearsOfExperience: Optional[int] = Field(None, ge=0)
    isAcceptingPatients: Optional[bool] = None

class UpdateVolunteerProfileSchema(BaseModel):
    skills: Optional[List[str]] = None
    bio: Optional[str] = None

class UpdateCaregiverProfileSchema(BaseModel):
    relationshipToPatient: Optional[str] = Field(None, max_length=100)
    availability: Optional[str] = Field(None, max_length=100)

class UpdateNurseProfileSchema(BaseModel):
    licenseNumber: Optional[str] = Field(None, max_length=100)
    specialty: Optional[str] = Field(None, max_length=100)
    yearsOfExperience: Optional[int] = Field(None, ge=0)
    isAcceptingAssignments: Optional[bool] = None

class UpdateOrganizationProfileSchema(BaseModel):
    organizationName: Optional[str] = Field(None, max_length=200)
    registrationNumber: Optional[str] = Field(None, max_length=100)
    contactPerson: Optional[str] = Field(None, max_length=100)
    contactPhone: Optional[str] = Field(None, max_length=20)
    serviceArea: Optional[str] = Field(None, max_length=200)

class UpdateHospitalProfileSchema(BaseModel):
    hospitalName: Optional[str] = Field(None, max_length=200)
    registrationNumber: Optional[str] = Field(None, max_length=100)
    palliativeCareUnit: Optional[bool] = None
    contactPerson: Optional[str] = Field(None, max_length=100)
    contactPhone: Optional[str] = Field(None, max_length=20)

# Response DTOs
class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    firstName: str
    lastName: str
    phone: Optional[str] = None
    city: Optional[str] = None
    zipCode: Optional[str] = None
    avatarUrl: Optional[str] = None
    role: Role
    accountStatus: AccountStatus
    verificationStatus: VerificationStatus
    emailNotificationsEnabled: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class PatientProfileResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    dateOfBirth: Optional[date] = None
    gender: Optional[str] = None
    medicalNotes: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    emergencyContactRelationship: Optional[str] = None
    bloodGroup: Optional[str] = None
    allergies: Optional[List[str]] = None
    medicalConditions: Optional[List[str]] = None
    currentMedications: Optional[List[str]] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class DoctorProfileResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    specialty: str
    licenseNumber: str
    bio: Optional[str] = None
    qualifications: Optional[str] = None
    hospital: Optional[str] = None
    yearsOfExperience: Optional[int] = None
    isAcceptingPatients: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class VolunteerProfileResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    skills: List[str]
    bio: Optional[str] = None
    totalTasksCompleted: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class CaregiverProfileResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    relationshipToPatient: Optional[str] = None
    availability: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class NurseProfileResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    licenseNumber: str
    specialty: Optional[str] = None
    yearsOfExperience: Optional[int] = None
    isAcceptingAssignments: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class OrganizationProfileResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    organizationName: str
    registrationNumber: Optional[str] = None
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    serviceArea: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class HospitalProfileResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    hospitalName: str
    registrationNumber: Optional[str] = None
    palliativeCareUnit: bool
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class FamilyRelationshipResponse(BaseModel):
    id: uuid.UUID
    patientId: uuid.UUID
    familyMemberId: uuid.UUID
    inviteCode: str
    relationshipType: Optional[str] = None
    status: FamilyRelationshipStatus
    initiatedById: uuid.UUID
    linkedAt: Optional[datetime] = None
    revokedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

# Phase 2 Schemas
class CaregiverPatientLinkResponse(BaseModel):
    id: uuid.UUID
    caregiverId: uuid.UUID
    patientId: uuid.UUID
    permissions: List[str]
    status: FamilyRelationshipStatus
    linkedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class TimelineEventResponse(BaseModel):
    id: uuid.UUID
    patientId: uuid.UUID
    authorId: Optional[uuid.UUID] = None
    eventType: TimelineEventType
    description: Optional[str] = None
    relatedEntityId: Optional[uuid.UUID] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class CarePlanResponse(BaseModel):
    id: uuid.UUID
    patientId: uuid.UUID
    authorId: Optional[uuid.UUID] = None
    status: CarePlanStatus
    reviewDate: Optional[date] = None
    goals: Optional[List[str]] = None
    notes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class CreateTimelineEventSchema(BaseModel):
    eventType: TimelineEventType
    description: Optional[str] = None
    relatedEntityId: Optional[uuid.UUID] = None

class CreateCarePlanSchema(BaseModel):
    reviewDate: Optional[date] = None
    goals: Optional[List[str]] = None
    notes: Optional[str] = None

class LinkPatientSchema(BaseModel):
    inviteCode: str

# Phase 3 Schemas
class ClinicalAssignmentResponse(BaseModel):
    id: uuid.UUID
    clinicianId: uuid.UUID
    patientId: uuid.UUID
    roleContext: ClinicalRoleContext
    status: str
    assignedAt: datetime

    class Config:
        from_attributes = True

class VitalsRecordResponse(BaseModel):
    id: uuid.UUID
    patientId: uuid.UUID
    recordedById: Optional[uuid.UUID] = None
    bloodPressure: Optional[str] = None
    heartRate: Optional[int] = None
    temperature: Optional[float] = None
    oxygenSaturation: Optional[int] = None
    recordedAt: datetime

    class Config:
        from_attributes = True

class ConsultationNoteResponse(BaseModel):
    id: uuid.UUID
    patientId: uuid.UUID
    doctorId: Optional[uuid.UUID] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    consultationDate: datetime

    class Config:
        from_attributes = True

class PrescriptionResponse(BaseModel):
    id: uuid.UUID
    patientId: uuid.UUID
    doctorId: Optional[uuid.UUID] = None
    medicationName: str
    dosage: str
    frequency: str
    durationDays: Optional[int] = None
    issuedAt: datetime

    class Config:
        from_attributes = True

class CreateClinicalAssignmentSchema(BaseModel):
    patientId: uuid.UUID
    roleContext: ClinicalRoleContext

class CreateVitalsRecordSchema(BaseModel):
    bloodPressure: Optional[str] = None
    heartRate: Optional[int] = None
    temperature: Optional[float] = None
    oxygenSaturation: Optional[int] = None

class CreateConsultationNoteSchema(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None

class CreatePrescriptionSchema(BaseModel):
    medicationName: str
    dosage: str
    frequency: str
    durationDays: Optional[int] = None

# Phase 4 Schemas
class ServiceRequestResponse(BaseModel):
    id: uuid.UUID
    patientId: uuid.UUID
    organizationId: Optional[uuid.UUID] = None
    volunteerId: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    requestType: ServiceRequestType
    status: ServiceRequestStatus
    dueDate: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class CreateServiceRequestSchema(BaseModel):
    title: str
    description: Optional[str] = None
    requestType: ServiceRequestType
    dueDate: Optional[datetime] = None

class ClaimServiceRequestSchema(BaseModel):
    volunteerId: Optional[uuid.UUID] = None # Or organizationId could be sent, depending on who claims

class UpdateServiceRequestStatusSchema(BaseModel):
    status: ServiceRequestStatus

# Phase 5 Schemas
class DoctorDirectoryResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    firstName: str
    lastName: str
    specialty: str
    hospital: Optional[str] = None
    yearsOfExperience: Optional[int] = None
    bio: Optional[str] = None
    isAcceptingPatients: bool

    class Config:
        from_attributes = True

class HospitalDirectoryResponse(BaseModel):
    id: uuid.UUID
    userId: uuid.UUID
    hospitalName: str
    contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None
    palliativeCareUnit: bool

    class Config:
        from_attributes = True

# Phase 6 Schemas
class AdminUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    firstName: str
    lastName: str
    role: Role
    verificationStatus: VerificationStatus
    createdAt: datetime

    class Config:
        from_attributes = True

class AdminVerifyUserSchema(BaseModel):
    verificationStatus: VerificationStatus
