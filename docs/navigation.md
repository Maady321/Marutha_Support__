# Ashwasa - Navigation Architecture

This document defines the global navigation structure for the Ashwasa platform, detailing both public routes and authenticated routes grouped by user role.

## 1. Public Navigation

The public-facing navigation is accessible to non-authenticated users.

### Header Links
- **Home** (`/`)
- **About** (`/about`)
- **Services** (`/services`)
- **Resources** (`/resources`)
- **Doctors** (`/doctors`)
- **Support** (`/support`)
- **Login** (`/login`)
- **Register** (`/register`)

### Footer Links
- **Platform**: Home, About Us, Careers, Contact
- **Services**: For Patients, For Doctors, For Volunteers, For Families
- **Legal**: Terms of Service, Privacy Policy, Cookie Policy, HIPAA Compliance
- **Support**: Help Center, FAQ, Emergency Contacts

---

## 2. Authenticated Navigation (By Role)

Authenticated users will see a primary navigation (sidebar or top menu based on device size) customized for their specific role.

### Patient
- **Dashboard** (`/patient/dashboard`)
- **Doctors** (`/patient/doctors`)
- **Appointments** (`/patient/appointments`)
- **Support Requests** (`/patient/support-requests`)
- **Messages** (`/patient/messages`)
- **Resources** (`/patient/resources`)
- **Profile** (`/patient/profile`)

### Doctor
- **Dashboard** (`/doctor/dashboard`)
- **Appointments** (`/doctor/appointments`)
- **Patients** (`/doctor/patients`)
- **Messages** (`/doctor/messages`)
- **Availability** (`/doctor/availability`)
- **Profile** (`/doctor/profile`)

### Family Member
- **Dashboard** (`/family/dashboard`)
- **Connected Patients** (`/family/patients`)
- **Appointments** (`/family/appointments`)
- **Support** (`/family/support`)
- **Messages** (`/family/messages`)
- **Resources** (`/family/resources`)
- **Profile** (`/family/profile`)

### Volunteer
- **Dashboard** (`/volunteer/dashboard`)
- **Support Opportunities** (`/volunteer/opportunities`)
- **My Assignments** (`/volunteer/assignments`)
- **Messages** (`/volunteer/messages`)
- **Availability** (`/volunteer/availability`)
- **Profile** (`/volunteer/profile`)

### Admin
- **Dashboard** (`/admin/dashboard`)
- **Users** (`/admin/users`)
- **Doctors** (`/admin/doctors`)
- **Volunteers** (`/admin/volunteers`)
- **Appointments** (`/admin/appointments`)
- **Support Requests** (`/admin/support-requests`)
- **Resources** (`/admin/resources`)
- **Reports** (`/admin/reports`)
- **Audit Logs** (`/admin/audit-logs`)
- **Settings** (`/admin/settings`)
