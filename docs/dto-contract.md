# Ashwasa DTO Contract

This document defines the complete Data Transfer Object (DTO) contract for the Ashwasa platform, specifying what clients can send and what the server will return.

## 1. DTO Design Principles

*   **Request DTOs**: Define what the client CAN send. Whitelist-only (strip unknown properties).
*   **Response DTOs**: Define what the server WILL return. Never expose sensitive fields.
*   **Separation**: Separate Create, Update, and Response DTOs for each resource.
*   **Validation**: All request DTOs validated via `class-validator` decorators in NestJS `ValidationPipe`.
*   **Transformation**: `class-transformer` to strip undefined fields, trim strings, lowercase emails.
*   **CRITICAL**: Clients MUST NEVER be able to set: `role`, `accountStatus`, `verificationStatus`, `passwordHash`, `refreshTokenHash`, or any security-critical field via a request DTO.

---

## 2. Auth DTOs

### RegisterUserRequest
```typescript
{
  email: string        // @IsEmail(), @MaxLength(255), @Transform(lowercase + trim)
  password: string     // @MinLength(8), @Matches(uppercase+lowercase+number pattern)
  firstName: string    // @IsString(), @MinLength(1), @MaxLength(100), @Transform(trim)
  lastName: string     // @IsString(), @MinLength(1), @MaxLength(100), @Transform(trim)
  role: UserRole       // @IsEnum(UserRole), NOT 'ADMIN'
  phone?: string       // @IsOptional(), @MaxLength(20)
  city?: string        // @IsOptional(), @MaxLength(100)
}
```

### LoginRequest
```typescript
{
  email: string        // @IsEmail(), @Transform(lowercase + trim)
  password: string     // @IsString(), @MinLength(1)
}
```

### ForgotPasswordRequest
```typescript
{
  email: string        // @IsEmail(), @Transform(lowercase + trim)
}
```

### ResetPasswordRequest
```typescript
{
  token: string        // @IsString(), @MinLength(1)
  newPassword: string  // @MinLength(8), @Matches(complexity pattern)
}
```

### VerifyEmailRequest
```typescript
{
  token: string        // @IsString(), @MinLength(1)
}
```

### AuthUserResponse
```typescript
{
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  accountStatus: AccountStatus
  verificationStatus: VerificationStatus
  emailVerified: boolean
  avatarUrl: string | null
  phone: string | null
  city: string | null
  emailNotificationsEnabled: boolean
  lastLoginAt: string | null
  createdAt: string
}
```
*NOTE: NEVER includes `passwordHash`, `refreshTokenHash`, tokens, `failedLoginAttempts`, `lockoutUntil`*

---

## 3. User DTOs

### UpdateUserRequest
```typescript
{
  firstName?: string   // @IsOptional(), @MaxLength(100), @Transform(trim)
  lastName?: string    // @IsOptional(), @MaxLength(100), @Transform(trim)
  phone?: string       // @IsOptional(), @MaxLength(20)
  city?: string        // @IsOptional(), @MaxLength(100)
  zipCode?: string     // @IsOptional(), @MaxLength(20)
  avatarUrl?: string   // @IsOptional(), @IsUrl()
}
```
*CANNOT set: `email`, `role`, `accountStatus`, `verificationStatus`, `password`*

### UpdatePreferencesRequest
```typescript
{
  emailNotificationsEnabled?: boolean  // @IsOptional(), @IsBoolean()
}
```

### UserSummaryResponse (used in lists, participants)
```typescript
{
  id: string
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl: string | null
}
```

---

## 4. Patient DTOs

### UpdatePatientProfileRequest
```typescript
{
  dateOfBirth?: string              // @IsOptional(), @IsDateString()
  gender?: string                   // @IsOptional(), @MaxLength(20)
  medicalNotes?: string             // @IsOptional(), @MaxLength(2000)
  emergencyContactName?: string     // @IsOptional(), @MaxLength(100)
  emergencyContactPhone?: string    // @IsOptional(), @MaxLength(20)
  emergencyContactRelationship?: string // @IsOptional(), @MaxLength(50)
}
```

### PatientProfileResponse
```typescript
{
  id: string
  userId: string
  dateOfBirth: string | null
  gender: string | null
  medicalNotes: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelationship: string | null
  createdAt: string
  updatedAt: string
}
```
*Sensitive fields (`medicalNotes`, `emergencyContact`) only returned to: owner, linked family, admin*

---

## 5. Doctor DTOs

### UpdateDoctorProfileRequest
```typescript
{
  specialty?: string           // @IsOptional(), @MaxLength(100)
  licenseNumber?: string       // @IsOptional(), @MaxLength(100)
  bio?: string                 // @IsOptional(), @MaxLength(2000)
  qualifications?: string      // @IsOptional(), @MaxLength(1000)
  hospital?: string            // @IsOptional(), @MaxLength(200)
  yearsOfExperience?: number   // @IsOptional(), @IsInt(), @Min(0), @Max(70)
  isAcceptingPatients?: boolean // @IsOptional(), @IsBoolean()
}
```

### DoctorPublicResponse (for search/listing)
```typescript
{
  id: string
  userId: string
  firstName: string
  lastName: string
  specialty: string
  hospital: string | null
  city: string | null
  yearsOfExperience: number | null
  bio: string | null
  isAcceptingPatients: boolean
  avatarUrl: string | null
}
```
*Does NOT include: `licenseNumber`, `email`, `phone`, `verificationDocuments`*

### DoctorPrivateResponse (for self)
```typescript
{
  ...DoctorPublicResponse,
  licenseNumber: string
  qualifications: string | null
  verificationStatus: VerificationStatus
  createdAt: string
  updatedAt: string
}
```

### CreateAvailabilitySlotRequest
```typescript
{
  slotDate: string      // @IsDateString(), must be future date
  startTime: string     // @Matches(HH:mm pattern)
  endTime: string       // @Matches(HH:mm pattern), must be after startTime
}
```
*Can accept array for batch creation: `{ slots: CreateAvailabilitySlotRequest[] }`*

### AvailabilitySlotResponse
```typescript
{
  id: string
  doctorId: string
  slotDate: string
  startTime: string
  endTime: string
  isBooked: boolean
}
```

---

## 6. Volunteer DTOs

### UpdateVolunteerProfileRequest
```typescript
{
  skills?: string[]    // @IsOptional(), @IsArray(), @IsString({ each: true }), @MaxLength(50, { each: true })
  bio?: string         // @IsOptional(), @MaxLength(2000)
}
```

### VolunteerProfileResponse
```typescript
{
  id: string
  userId: string
  firstName: string
  lastName: string
  skills: string[]
  bio: string | null
  totalTasksCompleted: number
  verificationStatus: VerificationStatus
  avatarUrl: string | null
  createdAt: string
}
```

---

## 7. Family DTOs

### GenerateInviteResponse
```typescript
{
  inviteCode: string
  expiresAt: string    // 72 hours from creation
}
```

### AcceptInviteRequest
```typescript
{
  inviteCode: string   // @IsString(), @MinLength(1), @MaxLength(20)
  relationshipType?: string // @IsOptional(), @MaxLength(50) (e.g., 'Parent', 'Spouse')
}
```

### FamilyRelationshipResponse
```typescript
{
  id: string
  patientId: string
  patientName: string
  familyMemberId: string
  familyMemberName: string
  relationshipType: string | null
  status: FamilyRelationshipStatus
  linkedAt: string | null
  createdAt: string
}
```

---

## 8. Appointment DTOs

### CreateAppointmentRequest
```typescript
{
  doctorId: string         // @IsUUID()
  slotId: string           // @IsUUID()
  scheduledDate: string    // @IsDateString()
  startTime: string        // @Matches(HH:mm)
  endTime: string          // @Matches(HH:mm)
  reason?: string          // @IsOptional(), @MaxLength(500)
}
```

### CancelAppointmentRequest
```typescript
{
  cancellationReason?: string // @IsOptional(), @MaxLength(500)
}
```

### AppointmentResponse
```typescript
{
  id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  scheduledDate: string
  startTime: string
  endTime: string
  timezone: string
  status: AppointmentStatus
  reason: string | null
  notes: string | null       // Only visible to doctor + admin
  conversationId: string | null
  cancelledBy: string | null
  cancellationReason: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
```

### AppointmentListResponse (summary for lists)
```typescript
{
  id: string
  patientName: string
  doctorName: string
  doctorSpecialty: string
  scheduledDate: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  createdAt: string
}
```

---

## 9. Support Request DTOs

### CreateSupportRequestRequest
```typescript
{
  patientId?: string       // @IsOptional(), @IsUUID() — only for FAMILY_MEMBER creating on behalf
  title: string            // @IsString(), @MinLength(5), @MaxLength(200)
  description: string      // @IsString(), @MinLength(20), @MaxLength(2000)
  category: SupportRequestCategory // @IsEnum()
  city?: string            // @IsOptional(), @MaxLength(100)
}
```
*Note: If caller is PATIENT, `patientId` is auto-set to their own ID. If FAMILY_MEMBER, `patientId` must reference a patient they are actively linked to.*

### CancelSupportRequestRequest
```typescript
{
  cancellationReason?: string // @IsOptional(), @MaxLength(500)
}
```

### SupportRequestResponse
```typescript
{
  id: string
  patientId: string
  patientName: string
  createdById: string
  createdByName: string
  title: string
  description: string
  category: SupportRequestCategory
  city: string | null
  status: SupportRequestStatus
  volunteerId: string | null
  volunteerName: string | null
  conversationId: string | null
  assignedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}
```

### SupportRequestListResponse (for volunteer browsing)
```typescript
{
  id: string
  title: string
  category: SupportRequestCategory
  city: string | null
  status: SupportRequestStatus
  createdAt: string
}
```
*Does NOT include `patientName`, `description`, volunteer details*

---

## 10. Messaging DTOs

### CreateMessageRequest
```typescript
{
  content: string    // @IsString(), @MinLength(1), @MaxLength(5000)
}
```

### MessageResponse
```typescript
{
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatarUrl: string | null
  content: string
  status: MessageStatus
  readAt: string | null
  createdAt: string
}
```

### ConversationResponse
```typescript
{
  id: string
  contextType: ConversationContextType
  contextId: string
  status: ConversationStatus
  participants: UserSummaryResponse[]
  unreadCount: number
  lastMessage: MessageResponse | null
  createdAt: string
  updatedAt: string
}
```

---

## 11. Notification DTOs

### NotificationResponse
```typescript
{
  id: string
  type: NotificationType
  title: string
  body: string
  linkedEntityType: string | null
  linkedEntityId: string | null
  isRead: boolean
  createdAt: string
}
```

### UnreadCountResponse
```typescript
{
  count: number
}
```

---

## 12. Resource DTOs

### CreateResourceRequest (Admin)
```typescript
{
  title: string        // @MinLength(5), @MaxLength(200)
  content: string      // @MinLength(50)
  category: string     // @MaxLength(100)
  tags?: string[]      // @IsOptional(), @IsArray()
  status?: ResourceStatus // @IsOptional(), @IsEnum(), default DRAFT
}
```

### UpdateResourceRequest (Admin)
```typescript
{
  title?: string
  content?: string
  category?: string
  tags?: string[]
  status?: ResourceStatus
}
```

### ResourceResponse
```typescript
{
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  authorId: string
  authorName: string
  status: ResourceStatus
  createdAt: string
  updatedAt: string
}
```

---

## 13. File DTOs

### FileUploadResponse
```typescript
{
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageUrl: string      // Only for PUBLIC files; signed URL for PRIVATE
  accessLevel: FileAccessLevel
  status: FileStatus
  createdAt: string
}
```

---

## 14. Admin DTOs

### AdminUserListResponse
```typescript
{
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  accountStatus: AccountStatus
  verificationStatus: VerificationStatus
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
}
```

### VerifyUserRequest
```typescript
{
  decision: 'APPROVED' | 'REJECTED'  // @IsEnum()
  notes?: string                      // @IsOptional(), @MaxLength(500)
}
```

### SuspendUserRequest
```typescript
{
  reason: string    // @IsString(), @MinLength(10), @MaxLength(500)
}
```

### ReviewReportRequest
```typescript
{
  status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED' // @IsEnum()
  reviewNotes?: string // @IsOptional(), @MaxLength(500)
}
```

### AuditLogResponse
```typescript
{
  id: string
  action: AuditAction
  actorId: string
  actorEmail: string
  targetId: string | null
  targetType: string | null
  details: object | null
  ipAddress: string | null
  createdAt: string
}
```

### AnalyticsResponse
```typescript
{
  totalUsers: number
  usersByRole: { role: string, count: number }[]
  pendingVerifications: number
  appointmentStats: { total: number, byStatus: { status: string, count: number }[] }
  supportRequestStats: { total: number, byStatus: { status: string, count: number }[] }
  activeConversations: number
  pendingReports: number
}
```

---

## 15. Report DTOs

### CreateReportRequest
```typescript
{
  targetId: string         // @IsUUID()
  targetType: ReportTargetType // @IsEnum()
  reason: string           // @IsString(), @MinLength(10), @MaxLength(500)
  description?: string     // @IsOptional(), @MaxLength(2000)
}
```

### ReportResponse
```typescript
{
  id: string
  reporterId: string
  targetId: string
  targetType: ReportTargetType
  reason: string
  description: string | null
  status: ReportStatus
  reviewedBy: string | null
  reviewNotes: string | null
  createdAt: string
  reviewedAt: string | null
}
```

---

## 16. Common Query DTOs

### PaginationQuery
```typescript
{
  page?: number      // @IsOptional(), @IsInt(), @Min(1), default 1
  limit?: number     // @IsOptional(), @IsInt(), @Min(1), @Max(100), default 20
  sortBy?: string    // @IsOptional(), validated against whitelist
  sortOrder?: 'asc' | 'desc' // @IsOptional(), @IsEnum()
}
```

### CursorPaginationQuery (for messages)
```typescript
{
  cursor?: string    // @IsOptional(), @IsUUID() — last message ID
  limit?: number     // @IsOptional(), @IsInt(), @Min(1), @Max(50), default 50
  direction?: 'before' | 'after' // @IsOptional(), @IsEnum(), default 'before'
}
```

---

## 17. Enum Definitions (TypeScript)

The following TypeScript enums mirror the PostgreSQL enums and should be used in the DTOs:

```typescript
export enum UserRole {
  PATIENT = 'PATIENT',
  FAMILY_MEMBER = 'FAMILY_MEMBER',
  DOCTOR = 'DOCTOR',
  VOLUNTEER = 'VOLUNTEER',
  ADMIN = 'ADMIN'
}

export enum AccountStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
  DELETED = 'DELETED'
}

export enum VerificationStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum AppointmentStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export enum SupportRequestStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum SupportRequestCategory {
  TRANSPORT = 'TRANSPORT',
  ERRANDS = 'ERRANDS',
  COMPANIONSHIP = 'COMPANIONSHIP',
  HOUSEHOLD = 'HOUSEHOLD',
  OTHER = 'OTHER'
}

export enum FamilyRelationshipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED'
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export enum ConversationContextType {
  APPOINTMENT = 'APPOINTMENT',
  SUPPORT_REQUEST = 'SUPPORT_REQUEST',
  FAMILY = 'FAMILY'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ'
}

export enum NotificationType {
  APPOINTMENT_REQUESTED = 'APPOINTMENT_REQUESTED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  // ...other notification types
}

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum FileAccessLevel {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export enum FileStatus {
  UPLOADING = 'UPLOADING',
  AVAILABLE = 'AVAILABLE',
  QUARANTINED = 'QUARANTINED',
  DELETED = 'DELETED'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ReportTargetType {
  USER = 'USER',
  MESSAGE = 'MESSAGE',
  SUPPORT_REQUEST = 'SUPPORT_REQUEST'
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  // ...other audit actions
}
```
