import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, ForeignKey, Text, Date, Enum as SqlEnum, Index, Table, Uuid, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class Role(str, enum.Enum):
    PATIENT = "PATIENT"
    FAMILY_MEMBER = "FAMILY_MEMBER"
    DOCTOR = "DOCTOR"
    VOLUNTEER = "VOLUNTEER"
    ADMIN = "ADMIN"
    CAREGIVER = "CAREGIVER"
    NURSE = "NURSE"
    ORGANIZATION = "ORGANIZATION"
    HOSPITAL = "HOSPITAL"

class AccountStatus(str, enum.Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"
    DELETED = "DELETED"

class VerificationStatus(str, enum.Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class FamilyRelationshipStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    REVOKED = "REVOKED"

class TokenType(str, enum.Enum):
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    PASSWORD_RESET = "PASSWORD_RESET"

class CaregiverPermission(str, enum.Enum):
    FULL_ACCESS = "FULL_ACCESS"
    MEDICAL_VIEW = "MEDICAL_VIEW"
    APPOINTMENT_ONLY = "APPOINTMENT_ONLY"
    COMMUNICATION_ONLY = "COMMUNICATION_ONLY"

class TimelineEventType(str, enum.Enum):
    REGISTRATION = "REGISTRATION"
    ASSESSMENT = "ASSESSMENT"
    DIAGNOSIS = "DIAGNOSIS"
    CONSULTATION = "CONSULTATION"
    PRESCRIPTION = "PRESCRIPTION"
    CARE_PLAN = "CARE_PLAN"
    MEDICATION = "MEDICATION"
    HOME_VISIT = "HOME_VISIT"
    SYMPTOM = "SYMPTOM"
    VITAL = "VITAL"
    FOLLOW_UP = "FOLLOW_UP"
    REFERRAL = "REFERRAL"

class CarePlanStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    UNDER_REVIEW = "UNDER_REVIEW"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class ClinicalRoleContext(str, enum.Enum):
    PRIMARY_PHYSICIAN = "PRIMARY_PHYSICIAN"
    CONSULTING_SPECIALIST = "CONSULTING_SPECIALIST"
    VISITING_NURSE = "VISITING_NURSE"

class ServiceRequestType(str, enum.Enum):
    TRANSPORT = "TRANSPORT"
    MEDICAL_EQUIPMENT = "MEDICAL_EQUIPMENT"
    MEAL_DELIVERY = "MEAL_DELIVERY"
    COMPANIONSHIP = "COMPANIONSHIP"
    HOME_MAINTENANCE = "HOME_MAINTENANCE"
    OTHER = "OTHER"

class ServiceRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    passwordHash = Column(String, nullable=False)
    firstName = Column(String(100), nullable=False)
    lastName = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    zipCode = Column(String(20), nullable=True)
    avatarUrl = Column(Text, nullable=True)
    role = Column(SqlEnum(Role, name="role_enum"), default=Role.PATIENT, nullable=False)
    accountStatus = Column(SqlEnum(AccountStatus, name="account_status_enum"), default=AccountStatus.PENDING_VERIFICATION, nullable=False)
    verificationStatus = Column(SqlEnum(VerificationStatus, name="verification_status_enum"), default=VerificationStatus.NOT_REQUIRED, nullable=False)
    emailVerified = Column(Boolean, default=False, nullable=False)
    emailNotificationsEnabled = Column(Boolean, default=True, nullable=False)
    failedLoginAttempts = Column(Integer, default=0, nullable=False)
    lockoutUntil = Column(DateTime, nullable=True)
    lastLoginAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patientProfile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctorProfile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    volunteerProfile = relationship("VolunteerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    caregiverProfile = relationship("CaregiverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    nurseProfile = relationship("NurseProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    organizationProfile = relationship("OrganizationProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    hospitalProfile = relationship("HospitalProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    verificationTokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    auditLogs = relationship("AuditLog", back_populates="user")
    
    # Self-referential family relationships
    familyRelationships1 = relationship("FamilyRelationship", foreign_keys="[FamilyRelationship.patientId]", back_populates="patient", cascade="all, delete-orphan")
    familyRelationships2 = relationship("FamilyRelationship", foreign_keys="[FamilyRelationship.familyMemberId]", back_populates="familyMember", cascade="all, delete-orphan")
    initiatedFamilyRels = relationship("FamilyRelationship", foreign_keys="[FamilyRelationship.initiatedById]", back_populates="initiatedBy")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    dateOfBirth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    medicalNotes = Column(Text, nullable=True)
    emergencyContactName = Column(String(100), nullable=True)
    emergencyContactPhone = Column(String(20), nullable=True)
    emergencyContactRelationship = Column(String(50), nullable=True)
    bloodGroup = Column(String(10), nullable=True)
    allergies = Column(JSON, nullable=True, default=list)
    medicalConditions = Column(JSON, nullable=True, default=list)
    currentMedications = Column(JSON, nullable=True, default=list)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="patientProfile")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialty = Column(String(100), nullable=False, default="")
    licenseNumber = Column(String(100), nullable=False, default="")
    bio = Column(Text, nullable=True)
    qualifications = Column(Text, nullable=True)
    hospital = Column(String(200), nullable=True)
    yearsOfExperience = Column(Integer, nullable=True)
    isAcceptingPatients = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="doctorProfile")

    __table_args__ = (
        Index("idx_doctor_profiles_specialty_accepting", "specialty", "isAcceptingPatients"),
    )

class VolunteerProfile(Base):
    __tablename__ = "volunteer_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    skills = Column(JSON, nullable=False, default=list)
    bio = Column(Text, nullable=True)
    totalTasksCompleted = Column(Integer, default=0, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="volunteerProfile")

class CaregiverProfile(Base):
    __tablename__ = "caregiver_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    relationshipToPatient = Column(String(100), nullable=True)
    availability = Column(String(100), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="caregiverProfile")

class NurseProfile(Base):
    __tablename__ = "nurse_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    licenseNumber = Column(String(100), nullable=False, default="")
    specialty = Column(String(100), nullable=True)
    yearsOfExperience = Column(Integer, nullable=True)
    isAcceptingAssignments = Column(Boolean, default=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="nurseProfile")

class OrganizationProfile(Base):
    __tablename__ = "organization_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organizationName = Column(String(200), nullable=False)
    registrationNumber = Column(String(100), nullable=True)
    contactPerson = Column(String(100), nullable=True)
    contactPhone = Column(String(20), nullable=True)
    serviceArea = Column(String(200), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="organizationProfile")

class HospitalProfile(Base):
    __tablename__ = "hospital_profiles"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    hospitalName = Column(String(200), nullable=False)
    registrationNumber = Column(String(100), nullable=True)
    palliativeCareUnit = Column(Boolean, default=False, nullable=False)
    contactPerson = Column(String(100), nullable=True)
    contactPhone = Column(String(20), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="hospitalProfile")

class FamilyRelationship(Base):
    __tablename__ = "family_relationships"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    familyMemberId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    inviteCode = Column(String(20), unique=True, nullable=False)
    relationshipType = Column(String(50), nullable=True)
    status = Column(SqlEnum(FamilyRelationshipStatus, name="family_relationship_status_enum"), default=FamilyRelationshipStatus.PENDING, nullable=False)
    initiatedById = Column(Uuid, ForeignKey("users.id"), nullable=False)
    linkedAt = Column(DateTime, nullable=True)
    revokedAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patient = relationship("User", foreign_keys=[patientId], back_populates="familyRelationships1")
    familyMember = relationship("User", foreign_keys=[familyMemberId], back_populates="familyRelationships2")
    initiatedBy = relationship("User", foreign_keys=[initiatedById], back_populates="initiatedFamilyRels")

    __table_args__ = (
        Index("idx_family_relationships_patientId", "patientId"),
        Index("idx_family_relationships_familyMemberId", "familyMemberId"),
        Index("idx_family_relationships_inviteCode", "inviteCode"),
        Index("idx_family_relationships_status", "status"),
    )

class CaregiverPatientLink(Base):
    __tablename__ = "caregiver_patient_links"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    caregiverId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permissions = Column(JSON, nullable=False, default=list)
    status = Column(SqlEnum(FamilyRelationshipStatus, name="caregiver_link_status_enum"), default=FamilyRelationshipStatus.PENDING, nullable=False)
    linkedAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    caregiver = relationship("User", foreign_keys=[caregiverId])
    patient = relationship("User", foreign_keys=[patientId])

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    authorId = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    eventType = Column(SqlEnum(TimelineEventType, name="timeline_event_type_enum"), nullable=False)
    description = Column(Text, nullable=True)
    relatedEntityId = Column(Uuid, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    patient = relationship("User", foreign_keys=[patientId])
    author = relationship("User", foreign_keys=[authorId])

class CarePlan(Base):
    __tablename__ = "care_plans"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    authorId = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(SqlEnum(CarePlanStatus, name="care_plan_status_enum"), default=CarePlanStatus.DRAFT, nullable=False)
    reviewDate = Column(Date, nullable=True)
    goals = Column(JSON, nullable=True, default=list)
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patient = relationship("User", foreign_keys=[patientId])
    author = relationship("User", foreign_keys=[authorId])


class ClinicalAssignment(Base):
    __tablename__ = "clinical_assignments"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    clinicianId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    roleContext = Column(SqlEnum(ClinicalRoleContext, name="clinical_role_context_enum"), nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)
    assignedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    clinician = relationship("User", foreign_keys=[clinicianId])
    patient = relationship("User", foreign_keys=[patientId])

class VitalsRecord(Base):
    __tablename__ = "vitals_records"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recordedById = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    bloodPressure = Column(String(20), nullable=True)
    heartRate = Column(Integer, nullable=True)
    temperature = Column(Float, nullable=True)
    oxygenSaturation = Column(Integer, nullable=True)
    recordedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    patient = relationship("User", foreign_keys=[patientId])
    recordedBy = relationship("User", foreign_keys=[recordedById])

class ConsultationNote(Base):
    __tablename__ = "consultation_notes"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctorId = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    subjective = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    consultationDate = Column(DateTime, default=datetime.utcnow, nullable=False)
    patient = relationship("User", foreign_keys=[patientId])
    doctor = relationship("User", foreign_keys=[doctorId])

class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctorId = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    medicationName = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    durationDays = Column(Integer, nullable=True)
    issuedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    patient = relationship("User", foreign_keys=[patientId])
    doctor = relationship("User", foreign_keys=[doctorId])


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    patientId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organizationId = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    volunteerId = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    requestType = Column(SqlEnum(ServiceRequestType, name="service_request_type_enum"), nullable=False)
    status = Column(SqlEnum(ServiceRequestStatus, name="service_request_status_enum"), default=ServiceRequestStatus.PENDING, nullable=False)
    dueDate = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    patient = relationship("User", foreign_keys=[patientId])
    organization = relationship("User", foreign_keys=[organizationId])
    volunteer = relationship("User", foreign_keys=[volunteerId])

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refreshTokenHash = Column(String, nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    userAgent = Column(Text, nullable=True)
    ipAddress = Column(String(45), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        Index("idx_sessions_userId", "userId"),
    )

class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tokenHash = Column(String, nullable=False)
    type = Column(SqlEnum(TokenType, name="token_type_enum"), nullable=False)
    expiresAt = Column(DateTime, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="verificationTokens")

    __table_args__ = (
        Index("idx_verification_tokens_userId_type", "userId", "type"),
    )

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    userId = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    ipAddress = Column(String(45), nullable=True)
    userAgent = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="auditLogs")

    __table_args__ = (
        Index("idx_audit_logs_userId", "userId"),
    )
