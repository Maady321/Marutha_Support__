# Ashwasa Data Dictionary

This document provides a comprehensive data dictionary for the PostgreSQL database (managed via Prisma ORM) of the Ashwasa platform.

| Table | Column | Type | Required | Sensitive | Description |
|---|---|---|---|---|---|
| users | id | UUID | Yes | No | Primary key |
| users | email | String | Yes | INTERNAL | User's email address (unique) |
| users | password_hash | String | Yes | RESTRICTED | Hashed password |
| users | role | Enum(Role) | Yes | No | User's role (PATIENT, FAMILY_MEMBER, DOCTOR, VOLUNTEER, ADMIN) |
| users | first_name | String | Yes | INTERNAL | User's first name |
| users | last_name | String | Yes | INTERNAL | User's last name |
| users | phone | String | No | INTERNAL | User's phone number |
| users | city | String | No | No | User's city of residence |
| users | zip_code | String | No | No | User's zip code |
| users | avatar_url | String | No | No | URL to the user's avatar image |
| users | email_verified | Boolean | Yes | No | Whether the user's email is verified |
| users | account_status | Enum(AccountStatus) | Yes | No | Status (PENDING_VERIFICATION, ACTIVE, SUSPENDED, DEACTIVATED, DELETED) |
| users | verification_status | Enum(VerificationStatus)| Yes | No | Identity verification (NOT_REQUIRED, PENDING, APPROVED, REJECTED) |
| users | email_verification_token| String | No | RESTRICTED | Token for email verification |
| users | password_reset_token | String | No | RESTRICTED | Token for password reset |
| users | password_reset_expires| DateTime | No | No | Expiry time for password reset token |
| users | refresh_token_hash | String | No | RESTRICTED | Hashed refresh token for sessions |
| users | failed_login_attempts | Integer | Yes | No | Number of consecutive failed login attempts |
| users | lockout_until | DateTime | No | No | Timestamp until which the account is locked out |
| users | email_notifications_enabled| Boolean | Yes | No | Whether email notifications are enabled |
| users | last_login_at | DateTime | No | No | Timestamp of the last login |
| users | created_at | DateTime | Yes | No | Timestamp when the user was created |
| users | updated_at | DateTime | Yes | No | Timestamp when the user was last updated |
| users | deleted_at | DateTime | No | No | Timestamp for soft deletion |
| patient_profiles | id | UUID | Yes | No | Primary key |
| patient_profiles | user_id | UUID | Yes | No | Foreign key to users table |
| patient_profiles | date_of_birth | DateTime | Yes | CONFIDENTIAL| Patient's date of birth |
| patient_profiles | gender | String | No | INTERNAL | Patient's gender |
| patient_profiles | medical_notes | Text | No | CONFIDENTIAL| General medical notes or conditions |
| patient_profiles | emergency_contact_name | String | No | CONFIDENTIAL| Emergency contact person's name |
| patient_profiles | emergency_contact_phone | String | No | CONFIDENTIAL| Emergency contact person's phone |
| patient_profiles | emergency_contact_relationship| String | No | CONFIDENTIAL| Emergency contact person's relationship |
| patient_profiles | created_at | DateTime | Yes | No | Timestamp when the profile was created |
| patient_profiles | updated_at | DateTime | Yes | No | Timestamp when the profile was last updated |
| doctor_profiles | id | UUID | Yes | No | Primary key |
| doctor_profiles | user_id | UUID | Yes | No | Foreign key to users table |
| doctor_profiles | specialty | String | Yes | No | Doctor's medical specialty |
| doctor_profiles | license_number | String | Yes | INTERNAL | Doctor's medical license number |
| doctor_profiles | bio | Text | No | No | Doctor's biography/description |
| doctor_profiles | qualifications | Text | No | No | Doctor's academic/professional qualifications |
| doctor_profiles | hospital | String | No | No | Affiliated hospital or clinic |
| doctor_profiles | years_of_experience | Integer | Yes | No | Number of years of experience |
| doctor_profiles | is_accepting_patients | Boolean | Yes | No | Whether the doctor is accepting new patients |
| doctor_profiles | created_at | DateTime | Yes | No | Timestamp when the profile was created |
| doctor_profiles | updated_at | DateTime | Yes | No | Timestamp when the profile was last updated |
| volunteer_profiles| id | UUID | Yes | No | Primary key |
| volunteer_profiles| user_id | UUID | Yes | No | Foreign key to users table |
| volunteer_profiles| skills | String[] | No | No | Array of skills the volunteer possesses |
| volunteer_profiles| bio | Text | No | No | Volunteer's biography/description |
| volunteer_profiles| total_tasks_completed | Integer | Yes | No | Total support requests completed by the volunteer |
| volunteer_profiles| created_at | DateTime | Yes | No | Timestamp when the profile was created |
| volunteer_profiles| updated_at | DateTime | Yes | No | Timestamp when the profile was last updated |
| family_relationships| id | UUID | Yes | No | Primary key |
| family_relationships| patient_id | UUID | Yes | No | Foreign key to patient user |
| family_relationships| family_member_id| UUID | No | No | Foreign key to family member user (nullable until linked) |
| family_relationships| invite_code | String | Yes | RESTRICTED | Code used to invite the family member |
| family_relationships| relationship_type| String | Yes | No | Type of relationship (e.g., Parent, Sibling) |
| family_relationships| status | Enum(RelStatus) | Yes | No | Status (PENDING, ACTIVE, REJECTED, REVOKED) |
| family_relationships| initiated_by | UUID | Yes | No | User ID who initiated the relationship |
| family_relationships| linked_at | DateTime | No | No | Timestamp when the family member accepted |
| family_relationships| revoked_at | DateTime | No | No | Timestamp when the relationship was revoked |
| family_relationships| created_at | DateTime | Yes | No | Timestamp when the invite was created |
| family_relationships| updated_at | DateTime | Yes | No | Timestamp when the relationship was last updated |
| availability_slots| id | UUID | Yes | No | Primary key |
| availability_slots| doctor_id | UUID | Yes | No | Foreign key to doctor user |
| availability_slots| slot_date | Date | Yes | No | Date of the availability |
| availability_slots| start_time | Time | Yes | No | Start time of the slot |
| availability_slots| end_time | Time | Yes | No | End time of the slot |
| availability_slots| is_booked | Boolean | Yes | No | Whether the slot has been booked |
| availability_slots| created_at | DateTime | Yes | No | Timestamp when the slot was created |
| appointments | id | UUID | Yes | No | Primary key |
| appointments | patient_id | UUID | Yes | No | Foreign key to patient user |
| appointments | doctor_id | UUID | Yes | No | Foreign key to doctor user |
| appointments | slot_id | UUID | Yes | No | Foreign key to availability slot |
| appointments | scheduled_date | Date | Yes | No | Scheduled date |
| appointments | start_time | Time | Yes | No | Start time |
| appointments | end_time | Time | Yes | No | End time |
| appointments | timezone | String | Yes | No | Timezone of the appointment |
| appointments | status | Enum(ApptStatus)| Yes | No | Status (REQUESTED, CONFIRMED, REJECTED, CANCELLED, COMPLETED, NO_SHOW) |
| appointments | reason | Text | Yes | INTERNAL | Reason for the appointment |
| appointments | notes | Text | No | CONFIDENTIAL| Private notes regarding the appointment |
| appointments | conversation_id | UUID | No | No | Foreign key to associated conversation |
| appointments | cancelled_by | UUID | No | No | User ID who cancelled the appointment |
| appointments | cancellation_reason| Text | No | No | Reason for cancellation |
| appointments | completed_at | DateTime | No | No | Timestamp when completed |
| appointments | created_at | DateTime | Yes | No | Timestamp when the appointment was created |
| appointments | updated_at | DateTime | Yes | No | Timestamp when the appointment was last updated |
| support_requests | id | UUID | Yes | No | Primary key |
| support_requests | patient_id | UUID | Yes | No | Foreign key to patient user needing support |
| support_requests | created_by_id | UUID | Yes | No | Foreign key to user who created the request |
| support_requests | title | String | Yes | No | Title of the request |
| support_requests | description | Text | Yes | No | Detailed description |
| support_requests | category | Enum(ReqCategory)| Yes | No | Category (TRANSPORT, ERRANDS, COMPANIONSHIP, HOUSEHOLD, OTHER) |
| support_requests | city | String | Yes | No | City where the support is needed |
| support_requests | status | Enum(ReqStatus) | Yes | No | Status (OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED) |
| support_requests | volunteer_id | UUID | No | No | Foreign key to assigned volunteer user |
| support_requests | conversation_id | UUID | No | No | Foreign key to associated conversation |
| support_requests | assigned_at | DateTime | No | No | Timestamp when a volunteer was assigned |
| support_requests | completed_at | DateTime | No | No | Timestamp when completed |
| support_requests | cancelled_by | UUID | No | No | User ID who cancelled the request |
| support_requests | cancellation_reason| Text | No | No | Reason for cancellation |
| support_requests | created_at | DateTime | Yes | No | Timestamp when the request was created |
| support_requests | updated_at | DateTime | Yes | No | Timestamp when the request was last updated |
| conversations | id | UUID | Yes | No | Primary key |
| conversations | context_type | Enum(ConvContext)| Yes | No | Type of conversation (APPOINTMENT, SUPPORT_REQUEST, FAMILY) |
| conversations | context_id | UUID | Yes | No | ID of the related entity |
| conversations | status | Enum(ConvStatus)| Yes | No | Status (ACTIVE, CLOSED, ARCHIVED) |
| conversations | created_at | DateTime | Yes | No | Timestamp when the conversation was created |
| conversations | updated_at | DateTime | Yes | No | Timestamp when the conversation was last updated |
| conversation_participants | id | UUID | Yes | No | Primary key |
| conversation_participants | conversation_id | UUID | Yes | No | Foreign key to conversation |
| conversation_participants | user_id | UUID | Yes | No | Foreign key to participating user |
| conversation_participants | joined_at | DateTime | Yes | No | Timestamp when the user joined the conversation |
| conversation_participants | left_at | DateTime | No | No | Timestamp when the user left the conversation |
| messages | id | UUID | Yes | No | Primary key |
| messages | conversation_id | UUID | Yes | No | Foreign key to conversation |
| messages | sender_id | UUID | Yes | No | Foreign key to sender user |
| messages | content | Text | Yes | CONFIDENTIAL| Content of the message |
| messages | status | Enum(MsgStatus) | Yes | No | Delivery status (SENT, DELIVERED, READ) |
| messages | read_at | DateTime | No | No | Timestamp when the message was read |
| messages | created_at | DateTime | Yes | No | Timestamp when the message was created |
| notifications | id | UUID | Yes | No | Primary key |
| notifications | user_id | UUID | Yes | No | Foreign key to recipient user |
| notifications | type | Enum(NotifType) | Yes | No | Type of notification |
| notifications | title | String | Yes | No | Title of the notification |
| notifications | body | Text | Yes | No | Content of the notification |
| notifications | linked_entity_type| String | No | No | Type of entity linked to this notification |
| notifications | linked_entity_id| UUID | No | No | ID of the linked entity |
| notifications | is_read | Boolean | Yes | No | Whether the notification has been read |
| notifications | channel | Enum(Channel) | Yes | No | Delivery channel (IN_APP, EMAIL) |
| notifications | delivery_status | Enum(DelStatus) | Yes | No | Delivery status (PENDING, SENT, FAILED) |
| notifications | created_at | DateTime | Yes | No | Timestamp when the notification was created |
| resources | id | UUID | Yes | No | Primary key |
| resources | title | String | Yes | No | Title of the resource |
| resources | content | Text | Yes | No | Markdown/HTML content of the resource |
| resources | category | String | Yes | No | Category for grouping resources |
| resources | tags | String[] | No | No | Tags for searching/filtering |
| resources | author_id | UUID | Yes | No | Foreign key to admin user who authored it |
| resources | status | Enum(ResStatus) | Yes | No | Status (DRAFT, PUBLISHED, ARCHIVED) |
| resources | created_at | DateTime | Yes | No | Timestamp when created |
| resources | updated_at | DateTime | Yes | No | Timestamp when last updated |
| files | id | UUID | Yes | No | Primary key |
| files | uploaded_by | UUID | Yes | No | Foreign key to user who uploaded the file |
| files | original_name | String | Yes | INTERNAL | Original filename |
| files | mime_type | String | Yes | No | MIME type of the file |
| files | size_bytes | Integer | Yes | No | File size in bytes |
| files | storage_url | String | Yes | RESTRICTED | URL/Path in the storage provider |
| files | storage_provider| String | Yes | No | Storage provider (e.g., S3, Supabase) |
| files | access_level | Enum(AccessLvl) | Yes | No | Access level (PUBLIC, PRIVATE) |
| files | status | Enum(FileStatus)| Yes | No | Status (UPLOADING, AVAILABLE, QUARANTINED, DELETED) |
| files | linked_entity_type| String | No | No | Entity type this file is linked to |
| files | linked_entity_id| UUID | No | No | ID of the linked entity |
| files | created_at | DateTime | Yes | No | Timestamp when the file record was created |
| files | deleted_at | DateTime | No | No | Timestamp when the file was soft deleted |
| audit_logs | id | UUID | Yes | No | Primary key |
| audit_logs | action | Enum(AuditAct) | Yes | No | Action performed |
| audit_logs | actor_id | UUID | Yes | No | User ID who performed the action |
| audit_logs | target_id | UUID | No | No | ID of the entity affected |
| audit_logs | target_type | String | No | No | Type of the entity affected |
| audit_logs | details | JSONB | No | RESTRICTED | Additional details of the action |
| audit_logs | ip_address | String | No | INTERNAL | IP address of the actor |
| audit_logs | user_agent | String | No | No | User agent string |
| audit_logs | created_at | DateTime | Yes | No | Timestamp when the action occurred |
| reports | id | UUID | Yes | No | Primary key |
| reports | reporter_id | UUID | Yes | No | User ID who filed the report |
| reports | target_id | UUID | Yes | No | ID of the reported entity |
| reports | target_type | Enum(ReportTgt) | Yes | No | Type (USER, MESSAGE, SUPPORT_REQUEST) |
| reports | reason | String | Yes | No | Brief reason for reporting |
| reports | description | Text | No | No | Detailed explanation |
| reports | status | Enum(RepStatus) | Yes | No | Status (PENDING, REVIEWED, RESOLVED, DISMISSED) |
| reports | reviewed_by | UUID | No | No | Admin user ID who reviewed it |
| reports | review_notes | Text | No | INTERNAL | Internal notes from the reviewer |
| reports | created_at | DateTime | Yes | No | Timestamp when reported |
| reports | reviewed_at | DateTime | No | No | Timestamp when reviewed |
