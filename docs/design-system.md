# Ashwasa Design System

## 1. Brand Foundation

### Brand Personality
Ashwasa aims to provide a digital environment that feels **Calm, Human, Trustworthy, Accessible, Professional, Supportive, Clear, and Respectful**. The platform serves patients, their families, doctors, and volunteers during critical healthcare journeys. Our design language avoids being overly clinical, overly casual, or like a flashy tech startup. We prioritize clarity, empathy, and reliability.

### Design Principles

1. **Accessibility First, Always:** Design for all abilities, ages, and device types. Healthcare platforms must be universally accessible.
2. **Clarity over Cleverness:** Use plain language and standard UI patterns. Users may be stressed or overwhelmed; cognitive load must be minimized.
3. **Compassion in Every Interaction:** Tone, imagery, and error messages should convey empathy. Never blame the user.
4. **Unambiguous Trust:** Security, privacy, and data handling should feel transparent and robust.
5. **Clear Hierarchy:** The most important actions and information must always be the most prominent.
6. **Consistent Predictability:** The interface should behave the same way across the entire platform. Learn once, use everywhere.
7. **Action-Oriented Support:** Help users accomplish tasks smoothly. Provide clear next steps and minimize dead ends.
8. **Calm Aesthetics:** Use soothing colors and generous whitespace to reduce anxiety and create a supportive atmosphere.

---

## 2. Color System

Our color palette is designed to be calming, professional, and accessible.

> **CRITICAL ACCESSIBILITY RULE:** Color is NEVER the only way to communicate status. Always pair color changes with recognizable icons or clear text labels.

### Brand Colors
- **Primary:** Deep Teal (`#1D4ED8` / `hsl(224, 76%, 48%)`) - Represents trust, depth, and reliability.
- **Secondary:** Soft Aqua (`#0D9488` / `hsl(175, 84%, 32%)`) - Represents healing, calmness, and support.
- **Accent:** Warm Amber (`#D97706` / `hsl(38, 92%, 44%)`) - Used sparingly for calls to action or highlighting key human elements.

### Semantic Colors
- **Success:** Emerald Green (`#059669` / `hsl(161, 94%, 30%)`)
- **Warning:** Amber (`#D97706` / `hsl(38, 92%, 44%)`)
- **Error:** Crimson (`#DC2626` / `hsl(348, 83%, 51%)`)
- **Information:** Blue (`#2563EB` / `hsl(221, 83%, 53%)`)

### Neutral Colors
- **Background:** Off-White (`#F8FAFC` / `hsl(210, 40%, 98%)`)
- **Surface:** Pure White (`#FFFFFF` / `hsl(0, 0%, 100%)`)
- **Elevated Surface:** Very Light Gray (`#F1F5F9` / `hsl(210, 40%, 96%)`)
- **Border:** Light Gray (`#E2E8F0` / `hsl(214, 32%, 91%)`)
- **Text Primary:** Slate Gray/Near Black (`#0F172A` / `hsl(222, 47%, 11%)`)
- **Text Secondary:** Slate (`#475569` / `hsl(215, 19%, 35%)`)
- **Text Muted:** Light Slate (`#94A3B8` / `hsl(215, 14%, 65%)`)

### Theme Adaptations
- **Light Theme:** Default theme focusing on bright, airy spaces with high-contrast text.
- **Dark Theme:** Soothing dark mode using deep slate backgrounds (`#0F172A`), muted text colors, and desaturated semantic colors to reduce eye strain in low-light environments.

---

## 3. Typography

Typography in Ashwasa prioritizes legibility and clarity.

- **Primary Font:** Inter (or Roboto) - A clean, highly legible sans-serif font suitable for both long-form reading and UI elements.
- **Fallback Fonts:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.

### Type Scale Mapping

| Scale | Size (px) | Weight | Line Height | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 48px | Bold (700) | 1.1 | -0.02em | Major marketing headings, empty state titles |
| **H1** | 36px | Semi-Bold (600)| 1.2 | -0.01em | Page titles, major section headers |
| **H2** | 24px | Semi-Bold (600)| 1.3 | Normal | Card titles, modal headers, subsections |
| **H3** | 20px | Medium (500) | 1.4 | Normal | Form group headers, minor sub-sections |
| **H4** | 16px | Medium (500) | 1.5 | Normal | List headers, emphasized body |
| **Body Large** | 18px | Regular (400) | 1.6 | Normal | Long-form reading, introductory text |
| **Body** | 16px | Regular (400) | 1.5 | Normal | Standard UI text, paragraphs, list items |
| **Body Small** | 14px | Regular (400) | 1.5 | Normal | Secondary text, helper text, dense data |
| **Caption** | 12px | Regular (400) | 1.4 | 0.01em | Timestamps, very minor details |
| **Label** | 14px | Medium (500) | 1.0 | 0.02em | Buttons, form labels, badges (uppercase optional) |

---

## 4. Spacing System

We use an 8px base spacing scale (with 4px for fine-tuning) to ensure rhythm and consistency.

### Scale
- **2px** (micro)
- **4px** (3xs)
- **8px** (2xs)
- **12px** (xs)
- **16px** (sm) - *Base component padding*
- **20px** (md)
- **24px** (lg)
- **32px** (xl) - *Between sections within a card*
- **40px** (2xl)
- **48px** (3xl) - *Between distinct page sections*
- **64px** (4xl)
- **80px** (5xl)
- **96px** (6xl)

---

## 5. Layout System

- **Maximum Content Width:** `1200px` (provides focus and readability for textual content)
- **Grid System:** 12-column responsive grid.
  - Mobile: 4 columns, 16px margins, 16px gutters.
  - Tablet: 8 columns, 32px margins, 24px gutters.
  - Desktop: 12 columns, auto margins (centered), 32px gutters.
- **Sidebar Width:** `280px` fixed width on desktop.
- **Header Height:** `64px` fixed height.

---

## 6. Component Design System

### Buttons
- **Purpose:** Trigger actions.
- **Variants:**
  - **Primary:** Filled with Primary color. For the main action on a page.
  - **Secondary:** Filled with Elevated Surface color. For alternative actions.
  - **Outline:** Transparent with Border color. For secondary or tertiary actions.
  - **Ghost:** Transparent, no border. For subtle actions (e.g., Cancel).
  - **Destructive:** Filled or outlined with Error color. For deletions/cancellations.
- **States:** Default, Hover (darken/lighten background), Focus (prominent ring), Active (pressed), Disabled (reduced opacity, unclickable), Loading (spinner replaces icon or text).

### Forms & Inputs
- **Rules:**
  - Form labels are ALWAYS visible (do not rely on placeholders).
  - Clearly mark required fields with an asterisk (*) or "Required" text.
  - Use inline validation (validate on blur or while typing for specific formats like passwords).
  - Input padding must be generous (min 44px height for touch targets).

### Cards
- **Purpose:** Group related domain entity information.
- **Patterns:**
  - **Doctor Profile Card:** Avatar, Name (H3), Specialization, Next Available Slot, "Book" Button.
  - **Appointment Card:** Date/Time prominently displayed, Doctor/Patient name, Status Badge, "Reschedule/Cancel" secondary actions.
  - **Support Request Card:** Request ID, Category, Urgency, Status Badge, Preview text.

### Status Badges
- Small, rounded rectangles with semantic background and text colors indicating status.

---

## 7. Status & Empty/Error/Loading States

### Standardized Statuses
- **Success:** Completed, Approved, Verified
- **Warning:** Action Required, Expiring Soon
- **Error:** Failed, Rejected, Blocked
- **Pending/Neutral:** Draft, Processing, Waiting
- **Information:** New, Updated

### Domain Specific (Appointments)
- `Requested` (Neutral)
- `Confirmed` (Success)
- `Cancelled` (Error/Neutral)
- `Completed` (Success)
- `No-show` (Warning)

### Empty States
An empty state should never feel like a dead end. Every empty state must have:
1. **Illustration/Icon:** A friendly, calm graphic.
2. **What happened:** e.g., "No upcoming appointments."
3. **Why it matters / Context:** e.g., "You have no scheduled visits at this time."
4. **What to do next:** e.g., A primary button to "Book an Appointment."

### Error States
- **NEVER** show raw backend errors or stack traces to the user.
- Use compassionate language: "We couldn't load your medical records right now" instead of "Error 500: Database connection failed."
- Always provide a way to retry or contact support.

### Loading States
- Prefer **Skeleton Screens** over full-page spinners to reduce perceived wait time and prevent layout shift. Skeletons should roughly match the final content shape.

---

## 8. Motion & Elevation

### Border Radius
- **Small (sm):** `4px` (Inputs, small buttons, badges)
- **Medium (md):** `8px` (Standard buttons, dropdown menus)
- **Large (lg):** `12px` (Cards, Modals, large UI panels)
- **Pill (full):** `9999px` (Avatars, some status badges)

### Elevation & Shadows
Use shadows sparingly to indicate depth and hierarchy, not for decoration.
- **Shadow-sm:** Interactive elements (buttons, inputs on hover).
- **Shadow-md:** Dropdowns, popovers, tooltips.
- **Shadow-lg:** Modals, dialogs, floating action buttons.

### Motion
- Keep animations subtle, fast (150ms - 300ms), and purposeful.
- Fade-ins for page transitions; slide-ins for sidebars/modals.
- **CRITICAL:** Always respect the OS-level `prefers-reduced-motion` setting by disabling non-essential animations.
