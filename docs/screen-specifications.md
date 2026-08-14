# Ashwasa - Screen & Layout Specifications

This document outlines the detailed screen structures, dashboard layouts, responsive behaviors, and UI state handling for the Ashwasa platform.

## 1. Landing Page Structure

The landing page (`/`) serves as the primary marketing and entry point.

- **Hero**: Catchy headline, brief sub-headline, and primary Call-to-Action (CTA) buttons (Register / Learn More).
- **What it does**: Brief overview of the platform's core value proposition.
- **How it works**: 3-4 simple steps explaining the process for users.
- **Who we help**: Segments highlighting Patients, Doctors, Families, and Volunteers.
- **Key Services**: Highlight core features (Telehealth, Support Coordination, etc.).
- **Trust & Safety**: Badges, HIPAA compliance mention, encrypted messaging.
- **Resources**: Featured articles or guides.
- **CTA**: Final push for registration.
- **Footer**: Standard navigation footer.

---

## 2. Dashboard Layouts

Dashboards are tailored by role to answer the primary question: *"What do I need to know right now?"*

### Patient Dashboard
- **Upcoming Appointment**: Next scheduled visit with quick-join or reschedule actions.
- **Active Support Request**: Status of any ongoing requests for volunteer help.
- **Messages**: Unread message count and snippets from doctors or volunteers.
- **Quick Actions**: "Book Appointment", "Request Support".
- **Notifications**: System alerts, medication reminders, etc.

### Doctor Dashboard
- **Today's Appointments**: A timeline or list of the day's schedule.
- **Pending Requests**: New appointment requests waiting for approval.
- **Messages**: Urgent patient messages.
- **Availability Snippet**: Quick view of upcoming open slots.

### Family Dashboard
- **Connected Patients Status**: Overview of loved ones' well-being.
- **Upcoming Appointments**: Schedule for connected patients.
- **Active Requests**: Status of support requests made on behalf of the patient.
- **Notifications**: Alerts regarding patient updates.

### Volunteer Dashboard
- **Available Opportunities**: Open support requests matching their skills.
- **Active Assignments**: Tasks currently assigned to them.
- **Upcoming Tasks**: Deadlines or scheduled support sessions.

### Admin Dashboard
- **Platform Health**: High-level metrics (active users, system uptime).
- **Pending Verifications**: List of doctors/volunteers waiting for approval.
- **Open Reports**: User-reported issues or flags.
- **Audit Activity Summary**: Recent critical administrative actions.

---

## 3. Responsive Page Specifications

### General Pages (`/`, `/login`)
- **Desktop**: Full navigation header, multi-column layouts where applicable.
- **Tablet**: Condensed header, transition from 3-column to 2-column grids.
- **Mobile**: Hamburger menu for navigation, single-column stacked layout, full-width buttons.

### App Pages (`/dashboard`, `/appointments`, `/messages`)
- **Desktop**: Persistent left sidebar for navigation. Main content area takes remaining width. Complex tables are fully visible.
- **Tablet**: Sidebar collapses to icons only or becomes a slide-out drawer. Main content adjusts padding.
- **Mobile**: Sidebar moves to a bottom navigation bar or a hamburger drawer. Data tables convert to card lists. Sticky action buttons at the bottom for quick access (e.g., "New Message").

---

## 4. UX State Matrix

Handling different UI states correctly ensures a smooth user experience.

| Screen / Component | Loading State | Empty State | Error State | Unauthorized | Success |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Skeleton loaders for widgets | "Welcome! Here's how to get started." | "Failed to load dashboard data. [Retry]" | Redirect to login | Widgets populate with data |
| **Appointment List** | Skeleton list items | "You have no upcoming appointments. [Book Now]" | "Could not retrieve appointments." | "Access Denied" | List displays chronologically |
| **Conversation View** | Spinner in chat area | "Start a conversation..." | "Message failed to send. [Retry]" | "You cannot message this user." | Message appears with checkmark |
| **Doctor Search** | Shimmering doctor cards | "No doctors found matching your criteria." | "Search unavailable." | N/A (Public) | Results displayed |
