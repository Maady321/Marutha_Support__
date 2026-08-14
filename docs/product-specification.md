# Ashwasa — Product Specification

## 1. Product Overview

* **Product name:** Ashwasa
* **Product category:** Digital Health & Support Coordination Platform
* **Core purpose:** To bridge the gap between patients, families, healthcare professionals, and volunteers by providing a unified, secure digital environment for holistic support coordination.
* **Problem statement:** Patients and families often struggle to find, coordinate, and manage support resources, volunteer assistance, and healthcare communications within a fragmented ecosystem, leading to heightened stress, uncoordinated care, and underutilization of community support.
* **Target users:** Patients, family members/caregivers, verified doctors, verified volunteers, and platform administrators.
* **Primary value proposition:** A centralized, secure hub that simplifies support discovery, enables structured communication with healthcare professionals, and efficiently coordinates community volunteer assistance for patients.
* **Product vision:** To become the standard digital infrastructure for community-driven patient support and collaborative healthcare coordination.
* **Product mission:** To empower patients and families by seamlessly connecting them with verified medical guidance and dedicated community volunteer support in a secure, privacy-first environment.
* **Key differentiators:** Focuses on holistic support coordination (medical guidance + volunteer assistance + family involvement) rather than just doctor booking or telemedicine; strict role-based data boundaries; community-driven volunteer integration.
* **What Ashwasa is NOT:** It is NOT an Electronic Health Record (EHR) system, a telehealth/video consultation platform, a diagnostic tool, a medical billing software, or a generic social network.

---

## 2. Problem Definition

### Patients
* **Difficulty finding appropriate support:** Struggling to discover local resources and volunteer help.
* **Difficulty communicating with healthcare professionals:** Lack of asynchronous, structured, and secure channels to ask non-urgent questions.
* **Lack of organized support resources:** Information is scattered, unverified, and overwhelming.
* **Difficulty managing appointments and support requests:** Keeping track of medical visits and volunteer task requests in multiple places.

### Families/Caregivers
* **Difficulty coordinating support:** Managing care tasks across multiple family members is chaotic.
* **Difficulty finding reliable resources:** Finding trusted information and vetted community help.
* **Difficulty communicating with professionals:** Often left out of the loop in patient-doctor communications.
* **Difficulty getting assistance from volunteers/organizations:** No streamlined way to request help for errands, transport, or care tasks.

### Doctors
* **Patient communication:** Overwhelmed by unstructured, out-of-band communication (SMS, WhatsApp) which lacks privacy and context.
* **Appointment management:** High no-show rates and difficulty managing ad-hoc support consultations.
* **Patient information:** Lack of basic, pre-structured context before interacting with a patient.
* **Follow-up workflows:** Hard to track non-clinical support follow-ups.

### Volunteers
* **Finding support opportunities:** Difficult to find verified patients who genuinely need help.
* **Managing assigned requests:** No central place to view tasks, locations, and deadlines.
* **Communicating with patients/families:** Needing a secure way to communicate without giving out personal phone numbers.
* **Tracking completed support activities:** No record of the impact or hours they have contributed.

### NGOs/Organizations
* **Managing volunteers:** Difficult to track volunteer engagement.
* **Managing support programs:** Hard to distribute resources efficiently.
* **Receiving and handling requests:** Intake processes are manual and inefficient.
* **Monitoring activities:** Lack of oversight on task completion.

### Administrators
* **Platform management:** Managing users across different permission sets.
* **User verification:** Ensuring doctors and volunteers are who they claim to be.
* **Moderation:** Preventing abuse, harassment, and spam.
* **Security:** Protecting sensitive health-adjacent data.
* **Analytics:** Understanding platform usage to improve services.
* **Auditability:** Tracking who accessed what data and when.

---

## 3. Target Users

### 1. Patient
* **Goals:** Receive support, manage appointments, and communicate easily with doctors and volunteers.
* **Problems:** Overwhelmed by care management, isolated from community help.
* **Needs:** Simple interface, secure communication, reliable help.
* **Typical actions:** Create support requests, book appointments, message doctors, read resources.
* **Permissions:** Can manage own profile, create requests, grant access to family members.
* **Most important features:** Support Requests, Messaging, Appointments.
* **Possible risks or abuse scenarios:** Submitting fraudulent requests, harassment of volunteers.

### 2. Family Member / Caregiver
* **Goals:** Coordinate care for the patient, ease the patient's burden.
* **Problems:** Left out of the loop, overwhelmed by coordination tasks.
* **Needs:** Shared view of patient needs, ability to act on patient's behalf.
* **Typical actions:** Manage patient's support requests, communicate with volunteers.
* **Permissions:** Can view permitted patient data, create requests on behalf of patient.
* **Most important features:** Linked Profiles, Support Requests, Messaging.
* **Possible risks or abuse scenarios:** Unauthorized access to patient data, overriding patient wishes.

### 3. Doctor
* **Goals:** Provide guidance, manage support appointments efficiently.
* **Problems:** Unstructured communication, lack of time.
* **Needs:** Verified professional profile, control over availability, contextual messaging.
* **Typical actions:** Accept/reject appointments, message patients, set availability.
* **Permissions:** Can view basic profiles of matched patients, manage own availability.
* **Most important features:** Appointment Management, Secure Messaging.
* **Possible risks or abuse scenarios:** Unverified accounts giving medical advice, extracting patient data.

### 4. Volunteer
* **Goals:** Give back to the community, find meaningful support tasks.
* **Problems:** Hard to find verified needs, disorganized coordination.
* **Needs:** Clear task lists, safety protocols, easy communication.
* **Typical actions:** Browse support requests, accept assignments, update task status.
* **Permissions:** Can view accepted task details, message assigned patients.
* **Most important features:** Task Discovery, Assignment Management, Messaging.
* **Possible risks or abuse scenarios:** Flaking on tasks, preying on vulnerable patients.

### 5. NGO / Organization (Post-MVP)
* **Goals:** Scale community support, manage volunteer fleets.
* **Problems:** Administrative overhead, manual intake.
* **Needs:** Dashboard for bulk management, reporting tools.
* **Typical actions:** Onboard volunteers, assign tasks, view analytics.
* **Permissions:** Can manage associated volunteers and organization-level requests.
* **Most important features:** Volunteer Management, Analytics.
* **Possible risks or abuse scenarios:** Data scraping, spamming users.

### 6. Administrator
* **Goals:** Maintain platform health, safety, and security.
* **Problems:** Scaling manual moderation, verifying professional credentials.
* **Needs:** Powerful dashboards, audit logs, quick moderation tools.
* **Typical actions:** Approve doctor/volunteer profiles, suspend abusive accounts, review reports.
* **Permissions:** Full system access (excluding encrypted private messages).
* **Most important features:** User Verification, Moderation Queue, Audit Logs.
* **Possible risks or abuse scenarios:** Internal data leaks, account takeover.

---

## 4. User Roles and Permissions

**Authentication** verifies *who* the user is (e.g., verifying email, logging in). 
**Authorization** determines *what* the authenticated user is allowed to do based on their role.

### Role Hierarchy
1. `PATIENT`
2. `FAMILY_MEMBER`
3. `DOCTOR`
4. `VOLUNTEER`
5. `ADMIN`

### Permissions Matrix

| Role | View | Create | Edit | Delete | Communicate With |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PATIENT** | Own profile, resources, own requests, available doctors | Support requests, appointments, messages | Own profile, own requests | Own account, own requests | Doctors, Family, Assigned Volunteers, Admins |
| **FAMILY_MEMBER** | Linked patient data (if granted), resources | Requests on behalf of patient | Own profile | Own account | Doctors, Assigned Volunteers, Admins |
| **DOCTOR** | Own profile, requested patient context | Appointments (slots), messages | Own profile, availability | Own account, own slots | Patients (if appointment exists), Admins |
| **VOLUNTEER** | Own profile, available requests, accepted requests | Messages | Own profile, task status | Own account | Patients/Family (if assigned), Admins |
| **ADMIN** | All non-encrypted data, audit logs, analytics | Admin accounts, resources, categories | Any user status (suspend/verify), resources | Any abusive content | All Users |

---

## 5. Core Product Modules

### Identity & Authentication
* Registration (Role-based signup)
* Login / Logout
* Password reset & Email verification
* Profile management & Session management

### Patient Support
* Patient profile setup
* Support requests (Creation & tracking)
* Appointment management (Booking & cancellation)
* Doctor communication (Secure messaging)
* Resources (Access to educational material)
* Care/support history

### Doctor
* Doctor profile & Verification workflow (Credential upload)
* Availability (Setting open slots)
* Appointments (Accept/reject/reschedule)
* Patient communication
* Consultation notes (Internal, basic text only)

### Family / Caregiver
* Patient relationship (Linking accounts via invite code)
* Support coordination & Appointment tracking
* Support requests (On behalf of patient)

### Volunteer
* Volunteer profile & Verification workflow (Background/ID check)
* Availability & Preferences
* Support opportunities (Discovery feed)
* Assignment & Task status updates
* Activity history

### Organization / NGO
* **Decision:** EXCLUDED from MVP.
* **Reasoning:** Adding NGOs requires complex multi-tenant entity management, hierarchical permissions, and organizational liability tracking. The MVP must prove the core direct-to-consumer value proposition (Patient ↔ Volunteer / Patient ↔ Doctor) first.
* **Future Introduction:** Can be introduced in V2 via an "Organization Account" type that groups Volunteers under an NGO entity ID.

### Communication
* Patient ↔ Doctor (Unlocked upon appointment acceptance)
* Patient ↔ Family (Always open for linked accounts)
* Patient/Family ↔ Volunteer (Unlocked upon task assignment, locked upon completion)
* Notifications & Messaging rules (Anti-spam, moderation)

### Resources
* Articles & Guides (Admin generated)
* Categories, Search, and Moderation

### Administration
* User management & Verification queues
* Reports & Moderation
* Audit logs, Analytics, and System configuration

---

## 6. MVP Definition

### MUST HAVE (MVP Core)
* Role-based Registration & Authentication (Without this, there is no platform).
* Basic Profiles for Patients, Doctors, Volunteers.
* Support Request Creation & Volunteer Assignment (Core value prop).
* Doctor Appointment Booking & Availability Management (Core value prop).
* Secure 1:1 Messaging tied to active tasks/appointments (Crucial for coordination).
* Admin User Verification Queue (Necessary for safety).

### SHOULD HAVE (Fast Follows)
* Email Notifications for new messages/assignments (Drives engagement).
* Family/Caregiver account linking (Highly valuable for coordination, but complex for V1 launch).
* Basic Resource Library (Static articles).
* Reporting mechanism for abuse.

### COULD HAVE (Nice to Have)
* In-app Push Notifications.
* Advanced Search filters (by distance/geolocation).
* Volunteer Activity History/Gamification.

### NOT MVP (Out of Scope)
* NGO/Organization Accounts.
* Video Consultations / Telehealth.
* Medical Billing / Payments.
* Electronic Health Record (EHR) integrations.
* Real-time location tracking for volunteers.

---

## 7. User Journeys

### Patient
`Register` → `Verify email` → `Complete patient profile` → `Find doctor/support` → `Request appointment/support` → `Communicate via messaging` → `Receive assistance` → `Mark task complete` → `View history`
* **Edge case:** No volunteers available in area. (Show friendly empty state, notify when one joins).

### Doctor
`Register` → `Submit credentials for verification` → `Wait for Admin approval` → `Complete professional profile` → `Set availability calendar` → `Receive appointment request` → `Accept/reject request` → `Communicate with patient` → `Complete consultation`
* **Edge case:** Doctor rejects request. (Patient is notified immediately to find another doctor).

### Family Member
`Register` → `Enter patient invite code to verify relationship` → `Connect to patient` → `View permitted information` → `Request support on behalf of patient` → `Manage appointments`
* **Edge case:** Patient revokes access. (Family member dashboard immediately clears patient data).

### Volunteer
`Register` → `Submit ID for verification` → `Wait for Admin approval` → `Complete profile` → `Set availability` → `Discover support request in feed` → `Accept assignment` → `Communicate with patient` → `Complete task` → `Submit completion status`
* **Edge case:** Volunteer accepts but cancels. (Task goes back to discovery feed, patient notified).

### Administrator
`Login` → `Dashboard overview` → `Review pending verification queue` → `Verify/Reject doctor & volunteer accounts` → `Review user reports` → `Moderate activity/Suspend users` → `Review basic analytics` → `Audit system activity`
* **Failure condition:** Admin loses password. (Requires strict out-of-band recovery process).

---

## 8. Functional Requirements

| ID | Feature | Description | Role | Priority | Preconditions | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-001** | Registration | Register with email, password, role | ALL | MUST | None | Account created, verification email sent |
| **AUTH-002** | Role Verification | Upload credentials for manual review | DOC, VOL | MUST | Registered | Account marked 'Pending Verification', limited access |
| **PAT-001** | Create Support Request | Create a task request with description/category | PAT | MUST | Verified email | Request appears in volunteer feed |
| **DOC-001** | Set Availability | Add open time slots to profile | DOC | MUST | Verified account | Slots visible to patients for booking |
| **VOL-001** | Accept Request | Claim an open support request | VOL | MUST | Verified account | Task assigned, messaging unlocked |
| **MSG-001** | Contextual Messaging | Send text messages related to a task/appointment | PAT, DOC, VOL | MUST | Active task/appt | Message sent, notification triggered |
| **ADMIN-001** | Verify User | Approve or reject a pending verification | ADMIN | MUST | User submitted docs | User gains full access or is rejected with reason |

---

## 9. Non-Functional Requirements

### Security
* **Authentication:** JWT/Session-based with secure, HttpOnly cookies.
* **Authorization:** Strict server-side checks for every API endpoint.
* **Password security:** Bcrypt hashing, minimum 8 characters, complex requirements.
* **Rate limiting:** API rate limits to prevent brute-force and DDoS (e.g., max 5 login attempts / min).
* **Input validation:** Sanitization of all user inputs to prevent XSS/SQLi.
* **File upload security:** Malware scanning, size limits (e.g., 5MB max), restricted MIME types (PDF, JPG, PNG).

### Performance
* **Page load:** < 2 seconds for initial paint.
* **API response:** < 300ms for 95th percentile.
* **Messaging:** Real-time or near real-time (< 1s delivery).

### Availability
* **Goal:** 99.9% uptime for core services.

### Scalability
* System should support 10,000 concurrent users at launch.
* Stateless backend architecture to allow horizontal scaling.

### Accessibility
* Target **WCAG 2.2 AA**. Keyboard navigation, high contrast modes, screen-reader compatibility.

### Responsiveness
* Full support for Desktop, Tablet, and Mobile browsers. Mobile-first UI design.

### Maintainability
* Strict linting, modular architecture, minimum 70% test coverage for critical paths, comprehensive API documentation (Swagger/OpenAPI).

---

## 10. Healthcare Data Boundaries

> **Principle:** Collect the minimum data required to provide the service.

### Data Ashwasa MAY handle:
* Basic user profile (Name, Email, basic demographics).
* Appointment metadata (Time, Date, Doctor Name).
* Support requests (Non-medical descriptions like "Need groceries", "Transport to clinic").
* Volunteer activity and task status.
* Doctor public profiles (Specialty, Bio).

### Data that requires stronger protection:
* Patient-Doctor communication logs.
* Internal consultation notes.
* Verification documents (IDs, Medical Licenses).

### Data Ashwasa SHOULD NOT collect unless absolutely necessary:
* Detailed Electronic Health Records (EHR).
* Diagnostic imaging, lab results.
* Payment/Credit Card data (Offload entirely to a third-party processor if ever needed).

*Note: Ashwasa is currently designed as a coordination platform, not an EHR. Prior to production, the architecture must be evaluated against local privacy regulations (e.g., HIPAA in the US, GDPR in Europe) specifically regarding the messaging module.*

---

## 11. Safety and Abuse Prevention

| Threat | Impact | Prevention | Detection | Response |
| :--- | :--- | :--- | :--- | :--- |
| **Fake Doctors** | Harmful medical advice | Manual admin verification of medical licenses | User reports, mismatched credentials | Immediate account ban, report to authorities |
| **Fake Volunteers** | Physical harm/theft to patients | Identity verification prior to activation | User reports, erratic behavior patterns | Permanent ban |
| **Harassment via Messages** | Emotional distress | Lock messaging to active tasks only | Profanity filters, user reporting tools | Account suspension, manual review |
| **Spam Requests** | Wasted volunteer time | Rate limiting request creation | High frequency anomaly detection | Temporary freeze, captcha |
| **Account Takeover** | Data breach | Strong password policies, rate limiting | Login anomalies (new IPs) | Force password reset, freeze account |

---

## 12. Notifications

### Required (MVP)
* Email: Account verification.
* Email: Password reset.
* In-app: Appointment request received / accepted / rejected.
* In-app: New message received.
* In-app: Support request assigned to volunteer.

### Optional (Fast Follow)
* Email: Daily digest of unread messages.
* Email: Notification of task completion.

### Future
* Push Notifications (Mobile native).
* SMS alerts for urgent appointment changes.

---

## 13. Search and Discovery

* **Doctors:** Patients can search by specialty, name, and availability. Filtering by "Accepting new patients".
* **Support Opportunities:** Volunteers browse a feed sorted by date created. Filtering by category (e.g., Transport, Errands, Companionship).
* **Resources:** Keyword search and category browsing (e.g., "Nutrition", "Mental Health").
* **Location:** Coarse location matching (e.g., City/Zip code) rather than precise GPS to protect privacy.

---

## 14. Reporting and Moderation

* **User Reports:** Any user can flag a message, profile, or support request as inappropriate.
* **Moderation Queue:** Reports feed into an Admin dashboard.
* **Account Suspension:** Admins can temporarily or permanently suspend accounts. Suspended users cannot log in and active tasks are cancelled.
* **Audit Trail:** Every moderation action (verify, suspend, delete) is logged with the Admin ID and timestamp.

---

## 15. Analytics

* **Registered & Active Users:** Segmented by role to track adoption.
* **Appointment Completion Rate:** To measure the effectiveness of the doctor module.
* **Support Request Fulfillment Rate:** (Total Assigned / Total Created) to measure community health.
* **Time-to-Assignment:** How fast volunteers pick up tasks.
* **Platform Health:** API error rates, page load times.

---

## 16. Business Rules

* **Messaging:** Users can ONLY message each other if an active appointment or support task exists between them.
* **Doctor/Volunteer Verification:** Accounts are strictly read-only (or locked out) until an Admin approves their credentials.
* **Task Cancellation:** If a volunteer cancels an accepted task, it immediately returns to the public queue.
* **Account Deletion:** Soft delete applied. Personal Identifiable Information (PII) is anonymized, but audit logs remain intact.
* **Family Access:** A patient must explicitly generate and share an invite code for a family member to link accounts. The patient can revoke this at any time.

---

## 17. Edge Cases

* **User abandons registration:** Clear stale unverified accounts after 30 days via cron job.
* **Patient cancels appointment last minute:** Notify doctor immediately; slot opens up in calendar.
* **Message delivery failure:** Show visual indicator (red exclamation mark) to sender.
* **Concurrent updates:** Optimistic UI updates with server-side transaction locks (e.g., two volunteers clicking 'Accept Task' simultaneously — only one succeeds, the other gets a graceful error).
* **Suspended account tries to access data:** Force logout immediately upon API request rejection (403 Forbidden).

---

## 18. Product Navigation

### Patient
`Dashboard` | `Find a Doctor` | `My Appointments` | `Support Requests` | `Messages` | `Resources` | `Settings`

### Doctor
`Dashboard` | `Availability` | `Appointments` | `Messages` | `Settings (Profile/Verification)`

### Family Member
`Patient Overview` | `Appointments` | `Support Requests` | `Messages` | `Settings`

### Volunteer
`Discover Tasks` | `My Assignments` | `Messages` | `Settings`

### Admin
`Dashboard` | `User Verification Queue` | `Moderation & Reports` | `Manage Resources` | `Audit Logs` | `Settings`

---

## 19. Success Metrics

1. **User Registration Completion:** > 80% of started signups complete email verification.
2. **Support Request Completion Rate:** > 75% of created requests are picked up and completed by volunteers.
3. **Appointment No-Show Rate:** Minimize no-shows through system reminders.
4. **Time to Verification:** Admins process pending verifications within 24 hours.
5. **System Reliability:** Zero critical data breaches; > 99.9% uptime.

---

## 20. MVP Release Plan

### Version 0.1 (Foundation)
* Database schema, Authentication, Role Management.
* Basic profile creation.

### Version 0.2 (Core user workflows)
* Patient creates support requests.
* Volunteer discovers and accepts requests.
* Doctor sets availability and Patient books appointments.

### Version 0.3 (Communication & Notifications)
* Contextual 1:1 Messaging.
* Email notifications for core events.

### Version 0.4 (Administration)
* Admin dashboards for user verification and basic moderation.

### Version 1.0 (Production-Ready MVP)
* UI Polish, security audits, performance testing, and production deployment.

---

## 21. Product Risks

* **Technical risks:** High concurrency during messaging spikes. *Mitigation: Scalable WebSocket architecture or efficient polling.*
* **Security & Privacy risks:** Leakage of sensitive health-adjacent data. *Mitigation: Strict authorization matrix, minimal data collection, security audits.*
* **UX risks:** Complex onboarding for elderly patients. *Mitigation: Simplified, high-contrast UI; Family Member proxy accounts.*
* **Operational risks:** Bottleneck in manual Admin verifications. *Mitigation: Streamlined admin UI, potential future integration with automated background check APIs.*
* **Scope-creep risks:** Attempting to build EHR features. *Mitigation: Strict adherence to this MVP specification.*

---

## 22. Final Product Definition

### Product Statement
Ashwasa is a digital platform designed to alleviate the burden of healthcare coordination by securely connecting patients and their families with verified medical professionals and dedicated community volunteers.

### MVP Statement
Version 1.0 delivers a secure, role-based web application where patients can book appointments with verified doctors, request specific non-medical assistance from verified volunteers, and communicate contextually, all governed by strict privacy boundaries and administrative oversight.

### Primary Users
Patient, Family Member, Doctor, Volunteer, Administrator.

### Core Modules
Identity/Auth, Support Coordination, Appointment Management, Contextual Messaging, Admin Verification/Moderation.

### Out of Scope for MVP
NGO/Organization Accounts, Video Consultations, Medical Billing, Electronic Health Records (EHR), Real-time GPS tracking.

### Product Principles
1. **Privacy by design:** Data access is strictly limited by role and active context.
2. **Minimum necessary data:** Only collect what is needed to coordinate support.
3. **Security by default:** Secure authentication, strict rate limiting, robust authorization.
4. **Clear user permissions:** Users always understand what they can and cannot do.
5. **Simple workflows:** Optimize for stressed patients and busy professionals.
6. **Human-centered design:** Accessible, responsive, and empathetic UI.
7. **Trust and Safety:** Mandatory manual verification for professionals and volunteers.
8. **Auditability:** Complete administrative logs for moderation actions.
9. **Reliability:** Built for high availability.
10. **Maintainability:** Clean architecture to support future feature expansion.
