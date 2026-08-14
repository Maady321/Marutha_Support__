# Ashwasa - Critical User Flows

This document visualizes the critical user journeys within the Ashwasa platform.

## 1. Authentication Flow

```mermaid
graph TD
    A[Start] --> B{Action}
    B -->|Login| C[Login Screen]
    B -->|Register| D[Registration Screen]
    B -->|Forgot Password| E[Reset Password Flow]
    
    C --> F{Valid Credentials?}
    F -->|Yes| G[Redirect to Role Dashboard]
    F -->|No| H[Show Error Message]
    
    D --> I[Enter Details & Select Role]
    I --> J[Send Verification Email]
    J --> K[User Verifies Email]
    K --> G
    
    E --> L[Enter Email]
    L --> M[Send Reset Link]
    M --> N[Set New Password]
    N --> C
```

## 2. Onboarding Flows

```mermaid
graph TD
    Start[User Registers] --> Role{Select Role}
    
    %% Patient Onboarding
    Role -->|Patient| P1[Create Account]
    P1 --> P2[Basic Profile Setup]
    P2 --> P3[Set Support Preferences]
    P3 --> PD[Patient Dashboard]
    
    %% Doctor Onboarding
    Role -->|Doctor| D1[Create Account]
    D1 --> D2[Professional Profile Setup]
    D2 --> D3[Upload Verification Docs]
    D3 --> D4[Set Initial Availability]
    D4 --> D5((Pending Admin Approval))
    
    %% Volunteer Onboarding
    Role -->|Volunteer| V1[Create Account]
    V1 --> V2[Profile Setup]
    V2 --> V3[List Skills/Interests]
    V3 --> V4[Set Availability]
    V4 --> V5((Pending Admin Approval))
    
    %% Family Onboarding
    Role -->|Family| F1[Create Account]
    F1 --> F2[Profile Setup]
    F2 --> F3[Request Patient Relationship]
    F3 --> F4((Pending Patient Approval))
```

## 3. Appointment Booking Flow

```mermaid
sequenceDiagram
    actor Patient
    participant System
    participant Doctor
    
    Patient->>System: Search for Doctor
    System-->>Patient: Return Doctor List
    Patient->>System: Select Doctor & View Profile
    System-->>Patient: Display Availability Slots
    Patient->>System: Select Slot & Confirm
    System->>Doctor: Send Booking Request
    System-->>Patient: Show "Requested" Status
    
    alt Doctor Approves
        Doctor->>System: Approve Request
        System->>Patient: Send Confirmation Notification
        System->>System: Update Appointment Status to Confirmed
    else Doctor Rejects
        Doctor->>System: Reject Request (with reason)
        System->>Patient: Send Rejection Notification
        System->>System: Release Slot
    end
```

## 4. Support Request Flow

```mermaid
stateDiagram-v2
    [*] --> Draft: Patient Starts Request
    Draft --> OpenQueue: Patient Submits
    
    state OpenQueue {
        [*] --> VisibleToVolunteers
    }
    
    OpenQueue --> Assigned: Volunteer Accepts
    
    state Assigned {
        [*] --> InProgress
        InProgress --> Completed: Task Finished
    }
    
    Completed --> [*]
```

## 5. Admin Verification Flow

```mermaid
graph TD
    A[New Doctor/Volunteer Registration] --> B[Docs Uploaded]
    B --> C[Status: Pending Verification]
    C --> D[Admin Dashboard Notification]
    D --> E[Admin Reviews Profile & Docs]
    
    E --> F{Decision}
    F -->|Approve| G[Status: Verified]
    G --> H[Notify User: Access Granted]
    
    F -->|Reject| I[Status: Rejected]
    I --> J[Notify User: Provide Reasons]
    J --> K[User Can Re-upload Docs]
    K --> C
```
