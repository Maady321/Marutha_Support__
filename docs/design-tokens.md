# Design Tokens Manifest

This document outlines the design tokens for Ashwasa, serving as a blueprint for `tailwind.config.ts` or CSS Custom Properties.

## 1. Colors

```css
:root {
  /* Brand */
  --color-primary-base: #1D4ED8;
  --color-primary-hover: #1E40AF;
  --color-primary-light: #DBEAFE;
  
  --color-secondary-base: #0D9488;
  --color-secondary-hover: #0F766E;
  --color-secondary-light: #CCFBF1;
  
  --color-accent-base: #D97706;
  --color-accent-hover: #B45309;

  /* Semantic */
  --color-success-base: #059669;
  --color-success-light: #D1FAE5;
  --color-warning-base: #D97706;
  --color-warning-light: #FEF3C7;
  --color-error-base: #DC2626;
  --color-error-light: #FEE2E2;
  --color-info-base: #2563EB;
  --color-info-light: #DBEAFE;

  /* Neutrals (Light Mode Default) */
  --color-bg-base: #F8FAFC;
  --color-surface-base: #FFFFFF;
  --color-surface-elevated: #F1F5F9;
  
  --color-border-base: #E2E8F0;
  --color-border-hover: #CBD5E1;
  
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  --color-text-inverse: #FFFFFF;
}

[data-theme="dark"] {
  /* Neutrals (Dark Mode) */
  --color-bg-base: #020617;
  --color-surface-base: #0F172A;
  --color-surface-elevated: #1E293B;
  
  --color-border-base: #334155;
  --color-border-hover: #475569;
  
  --color-text-primary: #F8FAFC;
  --color-text-secondary: #CBD5E1;
  --color-text-muted: #94A3B8;
  --color-text-inverse: #0F172A;

  /* Adjust semantics slightly for dark mode contrast if needed */
  --color-primary-base: #3B82F6;
  --color-secondary-base: #14B8A6;
}
```

## 2. Typography

```css
:root {
  /* Font Families */
  --font-family-primary: 'Inter', system-ui, -apple-system, sans-serif;
  
  /* Font Sizes */
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 2.25rem;    /* 36px */
  --font-size-4xl: 3rem;       /* 48px */

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-none: 1;
  --line-height-tight: 1.1;
  --line-height-snug: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;

  /* Letter Spacing */
  --letter-spacing-tighter: -0.02em;
  --letter-spacing-tight: -0.01em;
  --letter-spacing-normal: 0em;
  --letter-spacing-wide: 0.01em;
  --letter-spacing-wider: 0.02em;
}
```

## 3. Spacing & Layout

```css
:root {
  /* Spacing Scale (8px based) */
  --spacing-2: 0.125rem;  /* 2px */
  --spacing-4: 0.25rem;   /* 4px */
  --spacing-8: 0.5rem;    /* 8px */
  --spacing-12: 0.75rem;  /* 12px */
  --spacing-16: 1rem;     /* 16px */
  --spacing-20: 1.25rem;  /* 20px */
  --spacing-24: 1.5rem;   /* 24px */
  --spacing-32: 2rem;     /* 32px */
  --spacing-40: 2.5rem;   /* 40px */
  --spacing-48: 3rem;     /* 48px */
  --spacing-64: 4rem;     /* 64px */
  --spacing-80: 5rem;     /* 80px */
  --spacing-96: 6rem;     /* 96px */

  /* Layout Constraints */
  --layout-max-width: 1200px;
  --layout-sidebar-width: 280px;
  --layout-header-height: 64px;
}
```

## 4. Radii, Shadows & Borders

```css
:root {
  /* Border Radius */
  --radius-none: 0px;
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-full: 9999px;

  /* Shadows (Elevation) */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

## 5. Motion & Transitions

```css
:root {
  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;

  /* Timing Functions (Easings) */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
}
```

## 6. Z-Index Scale

```css
:root {
  --z-hide: -1;
  --z-base: 0;
  --z-docked: 10;
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-banner: 1200;
  --z-overlay: 1300;
  --z-modal: 1400;
  --z-popover: 1500;
  --z-skip-link: 1600;
  --z-toast: 1700;
  --z-tooltip: 1800;
}
```
