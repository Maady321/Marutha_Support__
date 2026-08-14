# Ashwasa: UI/UX & Design System Specification

## Platform Overview
Ashwasa is a digital healthcare support coordination platform. Our design must reflect our core values: Human, Calm, Modern, Trustworthy, and Professional.

## 1. Privacy-Aware UX

Handling sensitive medical and personal data requires a privacy-first approach.

*   **Hide Sensitive Info by Default**: Mask sensitive data such as full medical notes or emergency contact numbers initially. Provide a clear, purposeful action (e.g., a "Show" button with an eye icon) to reveal this information. Include a brief explanation of why permission is needed.
*   **Confirm Sensitive Actions**: Destructive or high-impact actions must always require explicit confirmation. Use confirmation modals for:
    *   Account deletion
    *   Relationship or access revocation
    *   Appointment cancellation
*   **Secure Notifications & URLs**: Avoid exposing Personal Health Information (PHI) or sensitive context in push notifications, email subjects, or public-facing URL parameters.

## 2. Content & Microcopy

The tone of our platform is critical to establishing trust and calm.

### Writing Principles
*   **Clear**: Avoid ambiguity. Tell the user exactly what is happening or what they need to do.
*   **Respectful & Human**: Treat the user with dignity. Avoid robotic or overly clinical phrasing.
*   **Concise**: Keep it brief. Users may be stressed; don't make them read essays.
*   **Non-judgmental**: Never blame the user for errors or missed actions.

### Copy Guidelines
*   **Avoid Technical Jargon**: Use everyday language.
*   **Avoid Fear-Based Messaging**: Use reassuring tones, especially around health data.
*   **Avoid Vague Button Labels**: Instead of "Submit" or "OK", use action-oriented labels like "Save Changes", "Send Message", or "Cancel Appointment".

### Examples
| Scenario | Bad Copy | Good Copy |
| :--- | :--- | :--- |
| Error State | Error 500: Invalid User Input. | We couldn't save your changes. Please check the highlighted fields and try again. |
| Appointment CTA | Submit | Book Appointment |
| Empty State | No records found. | You don't have any upcoming appointments yet. |

## 3. Toast and Feedback System

Provide clear feedback for user actions using the appropriate component:

*   **Toast (Short-lived feedback)**: For successful actions that don't interrupt the workflow (e.g., "Settings saved", "Message sent"). Should disappear automatically.
*   **Inline Message (Form-specific feedback)**: For validation errors or warnings directly related to user input (e.g., "Please enter a valid email address" below the input field).
*   **Banner (Important persistent info)**: For system-wide alerts or critical account status updates (e.g., "Your session will expire in 5 minutes", "Maintenance scheduled for tonight"). Requires dismissal.
*   **Modal (Decisions requiring user attention)**: For actions that need explicit confirmation or block the main workflow (e.g., "Are you sure you want to cancel this appointment?").

## 4. Admin UX

The administrative interface focuses on productivity and data management.

*   **Information Density**: Prioritize fitting relevant data on screen without overwhelming the user. Use data tables efficiently.
*   **Search & Filters**: Provide robust, persistent filtering and fast search capabilities across large datasets (patients, providers, support requests).
*   **Bulk Workflows**: Enable actions on multiple items at once (e.g., assigning multiple support requests).
*   **Auditability**: Clearly display timestamps, statuses, and user actions (e.g., "Last updated by Dr. Smith on Oct 12").
*   **Visual Design**: Avoid flashy elements. Use color sparingly to indicate status or priority. Optimize for efficiency and readability.

## 5. Domain-Specific UX Guides

### Messaging UX
*   **Conversation List**: Clearly indicate unread messages, timestamps, and active participants.
*   **Composer**: Support rich text basics, attachments (with clear file size limits), and a clear "Send" action.
*   **States**: Show read receipts, typing indicators, and clearly denote offline behavior (e.g., "Message will be sent when you are back online").

### Appointment UX
*   **Flow**: Find doctor → View availability (calendar view) → Select slot → Review details → Confirm.
*   **Feedback**: Provide immediate feedback if a selected slot becomes unavailable (conflict handling).
*   **Timezones**: Always display times in the user's local timezone, but provide clarity if the provider is in a different timezone.

### Support Request UX
*   **Flow**: Create request → Select specific type (dropdown/cards) → Describe need → Submit.
*   **Tracking**: Provide a clear status tracker (e.g., Submitted → Reviewed → Assigned → Resolved).

### Doctor Profile UX
*   **Information Architecture**: Prioritize Avatar, Specialty, Verification badge (crucial for trust), Experience, and Availability.
*   **CTAs**: Primary action should be prominent (e.g., "Book Appointment" or "Send Message").
*   **Privacy**: Limit exposure of personal contact info; route communication through the platform.

### Volunteer Opportunity UX
*   **Clarity**: Clearly list the Support type, Description, required Skills, and Time requirement.
*   **Action**: Provide a clear "Accept Opportunity" CTA.
