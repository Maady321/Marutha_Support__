# Ashwasa: Responsive Design Specification

## Overview
Ashwasa utilizes a **mobile-first approach**. We design for the smallest screens first and progressively enhance the experience for larger viewports, ensuring the application is fully functional and optimized across all devices.

## 1. Responsive Breakpoints

We utilize standard breakpoints to adapt the layout. These correspond to typical device widths.

*   **Mobile (xs)**: Base design (0px and up)
*   **Mobile Large / Tablet Portrait (sm)**: 640px
*   **Tablet Landscape (md)**: 768px
*   **Desktop (lg)**: 1024px
*   **Large Desktop (xl)**: 1280px
*   **Extra Large Desktop (2xl)**: 1536px

## 2. Mobile UX Principles

*   **Mobile as a First-Class Experience**: The mobile experience must not be an afterthought or a merely shrunken version of the desktop app. Core workflows must be optimized for touch and smaller viewports.
*   **Bottom Navigation**: For core app modules, utilize a bottom navigation bar on mobile for easy reachability with the thumb.
*   **Touch Targets & Sticky Actions**:
    *   Maintain minimum 44x44px touch targets.
    *   Keep primary calls to action (e.g., "Save", "Submit") sticky at the bottom of the screen during scrolling forms to ensure they are always accessible.
*   **Drawers and Bottom Sheets**: Replace complex, center-screen modals with bottom sheets or side drawers on mobile. They are easier to interact with one-handed and feel more native to the platform.

## 3. Responsive Component Behavior

### Navigation
*   **Desktop (`lg` and up)**: Persistent left sidebar containing main navigation links.
*   **Tablet (`md`)**: Collapsible sidebar (icons only, expanding on hover/click) or top navigation bar.
*   **Mobile (Base)**: Hamburger menu opening a full-screen or drawer overlay, OR a fixed bottom navigation bar for primary routes.

### Tables
*   **Desktop**: Standard full-width data tables with sortable columns.
*   **Tablet/Mobile**: Avoid forcing horizontal scrolling unless absolutely necessary (e.g., highly complex data). Instead, convert table rows into stacked **Cards**. Each card represents a row, with labels and values presented vertically.

### Forms
*   **Desktop**: Forms can utilize multi-column layouts (e.g., First Name and Last Name side-by-side) to maximize screen real estate.
*   **Mobile**: Forms must collapse into a strict **single-column layout**. Inputs should span 100% of the container width to provide maximum touch area.

### Cards & Grid Layouts
*   **Desktop**: Display items (like Doctor Profiles or Volunteer Opportunities) in multi-column grids (3 or 4 columns).
*   **Tablet**: Reduce to 2-column grids.
*   **Mobile**: Stack cards vertically in a single column (100% width).

### Modals vs. Sheets
*   **Desktop**: Use centered modal dialogs for critical interactions or workflows.
*   **Mobile**: Convert modals to **Bottom Sheets** that slide up from the bottom of the screen, anchoring to the user's thumb area.
