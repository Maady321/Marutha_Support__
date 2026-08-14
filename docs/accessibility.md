# Ashwasa: Accessibility Strategy

## Target Standard
Our goal is to meet and maintain **WCAG 2.2 AA** compliance across the Ashwasa platform to ensure it is usable by everyone, regardless of ability.

## 1. Keyboard Navigation & Focus Indicators
*   **Logical Tab Order**: Ensure the DOM structure dictates a logical, predictable reading and navigation order.
*   **Visible Focus Rings**: Never `outline: none` without providing an accessible alternative. Interactive elements must have a clear, high-contrast focus indicator (minimum 2px solid border) to show keyboard users where they are on the page.
*   **Skip Links**: Provide a "Skip to main content" link at the very top of the page for keyboard users to bypass repetitive navigation blocks.

## 2. Screen Readers & Semantic HTML
*   **Semantic Structure**: Use native HTML elements (`<nav>`, `<main>`, `<article>`, `<button>`, `<dialog>`) appropriately. Only use ARIA roles when native HTML does not support the required behavior.
*   **Heading Hierarchy**: Maintain a logical heading structure (`<h1>` through `<h6>`). Do not skip heading levels (e.g., jumping from `<h2>` to `<h4>`). The `<h1>` should uniquely identify the page content.
*   **Meaningful Link Text**: Avoid "Click here" or "Read more". Links should describe their destination (e.g., "Read our privacy policy").

## 3. Color and Contrast
*   **Text Contrast**: Ensure a minimum contrast ratio of **4.5:1** for regular text and **3:1** for large text (18pt normal or 14pt bold) against its background.
*   **UI Component Contrast**: Interactive components (buttons, form inputs) and graphical objects must have a minimum contrast ratio of **3:1** against adjacent colors.
*   **Never Rely on Color Alone**: Do not use color as the sole means of conveying information, indicating an action, or prompting a response. Always include text, icons, or patterns (e.g., a validation error should have a red border *and* an error message text with an alert icon).

## 4. Reduced Motion
*   **Respect User Preferences**: Use the `prefers-reduced-motion` media query to disable or reduce non-essential animations, transitions, and auto-playing media for users who are sensitive to motion.

## 5. Touch Targets
*   **Minimum Size**: Ensure all interactive elements (buttons, links, form fields) on touch devices have a minimum touch target size of **44x44 CSS pixels** to prevent accidental clicks and accommodate users with motor impairments.
*   **Spacing**: Provide adequate spacing between interactive elements.

## 6. Form Accessibility
*   **Explicit Labels**: Every input field must have an associated `<label>` element. Avoid relying solely on placeholders, as they disappear on input and often have poor contrast.
*   **Error Announcements**: Use `aria-live="polite"` or `aria-live="assertive"` to announce dynamic validation errors to screen readers as they occur.
*   **Fieldsets**: Group related form controls (like radio buttons or checkboxes) using `<fieldset>` and `<legend>`.

## 7. Modal Focus Management
*   **Focus Trapping**: When a modal dialog opens, keyboard focus must be trapped within the modal. Users should not be able to tab to elements behind the modal.
*   **Return Focus**: When the modal is closed, focus must return to the element that triggered the modal.

## 8. Status and Feedback
*   **Dynamic Updates**: Ensure screen reader users are notified of dynamic page updates (e.g., "Search results loaded", "Message sent") using appropriate ARIA live regions (`aria-live="polite"` for non-critical updates, `aria-live="assertive"` for critical alerts).
