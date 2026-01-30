# Design Tokens

CSS custom properties defined in `src/styles/variables.css`

**Philosophy:** Mobile-first, accessible, consistent

---

## Spacing Scale

8px base unit system:
```css
--space-1: 4px   /* 0.5 × base */
--space-2: 8px   /* 1 × base */
--space-3: 16px  /* 2 × base */
--space-4: 24px  /* 3 × base */
--space-5: 32px  /* 4 × base */
--space-6: 48px  /* 6 × base */
--space-7: 64px  /* 8 × base */
--space-8: 96px  /* 12 × base */
```

**Usage:**
```css
.card {
  padding: var(--space-3);        /* 16px */
  margin-bottom: var(--space-4);  /* 24px */
}
```

---

## Colors

### Light Mode (Default)
```css
/* Primary */
--color-primary: #007AFF;           /* iOS blue */
--color-primary-hover: #0051D5;

/* Backgrounds */
--color-background: #FFFFFF;
--color-surface: #F2F2F7;           /* iOS grouped background */
--color-surface-elevated: #FFFFFF;

/* Text */
--color-text: #000000;
--color-text-secondary: #8E8E93;    /* iOS secondary label */
--color-text-tertiary: #C7C7CC;

/* Borders */
--color-border: #E5E5EA;
--color-border-strong: #D1D1D6;

/* Semantic */
--color-error: #FF3B30;             /* iOS red */
--color-success: #34C759;           /* iOS green */
--color-warning: #FF9500;           /* iOS orange */
--color-info: #007AFF;
```

### Dark Mode
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Primary */
    --color-primary: #0A84FF;       /* iOS blue (dark) */
    --color-primary-hover: #409CFF;

    /* Backgrounds */
    --color-background: #000000;
    --color-surface: #1C1C1E;       /* iOS grouped background (dark) */
    --color-surface-elevated: #2C2C2E;

    /* Text */
    --color-text: #FFFFFF;
    --color-text-secondary: #8E8E93;
    --color-text-tertiary: #48484A;

    /* Borders */
    --color-border: #38383A;
    --color-border-strong: #48484A;

    /* Semantic */
    --color-error: #FF453A;
    --color-success: #32D74B;
    --color-warning: #FF9F0A;
    --color-info: #0A84FF;
  }
}
```

---

## Typography

### Font Sizes
```css
--font-xs: 12px;   /* Captions, fine print */
--font-sm: 14px;   /* Secondary text, labels */
--font-base: 16px; /* Body text (iOS default) */
--font-lg: 18px;   /* Subheadings */
--font-xl: 22px;   /* Page headings */
--font-2xl: 28px;  /* Large titles */
--font-3xl: 34px;  /* Hero text */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

**Usage:**
```css
.heading {
  font-size: var(--font-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}
```

---

## Touch Targets
```css
--touch-target: 44px;        /* iOS minimum */
--touch-target-large: 56px;  /* Material Design minimum */
```

**Rule:** All interactive elements must be at least 44×44px.
```css
.button {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
}
```

---

## Border Radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;  /* Pills, circular */
```

---

## Shadows
```css
/* Light mode */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.7);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.8);
  }
}
```

---

## Transitions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Easing functions:**
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Z-Index Scale
```css
--z-base: 0;
--z-dropdown: 1000;
--z-sticky: 1100;
--z-sheet: 2000;
--z-fab: 3000;
--z-menu: 4000;
--z-toast: 5000;
--z-tooltip: 6000;
```

**Usage:**
```css
.dropdown {
  z-index: var(--z-dropdown);
}

.fab {
  z-index: var(--z-fab);
}
```

---

## Breakpoints

Mobile-first approach:
```css
/* Default: 393px (iPhone 15 Pro) */

/* Tablet */
@media (min-width: 744px) {
  /* iPad Mini (744×1133) */
}

/* Desktop */
@media (min-width: 1024px) {
  /* iPad Pro / Desktop */
}

/* Large desktop */
@media (min-width: 1440px) {
  /* Wide screens */
}
```

---

## Safe Areas

For iOS notch and home indicator:
```css
/* Padding for iPhone notch/Dynamic Island */
--safe-area-top: env(safe-area-inset-top);
--safe-area-bottom: env(safe-area-inset-bottom);
--safe-area-left: env(safe-area-inset-left);
--safe-area-right: env(safe-area-inset-right);
```

**Usage:**
```css
.app-shell {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
}

.fab {
  bottom: calc(var(--space-4) + var(--safe-area-bottom));
}
```

---

## Layout
```css
/* Max widths */
--max-width-sm: 640px;
--max-width-md: 768px;
--max-width-lg: 1024px;
--max-width-xl: 1280px;

/* Container padding */
--container-padding: var(--space-4);
```

---

## Animation Durations
```css
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;
```

---

## Opacity Levels
```css
--opacity-disabled: 0.38;
--opacity-hover: 0.08;
--opacity-focus: 0.12;
--opacity-pressed: 0.16;
```

---

## Usage Examples

### Button Component
```css
.button {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-base);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  min-height: var(--touch-target);
  transition: all var(--transition-fast);
  background-color: var(--color-primary);
  color: white;
}

.button:hover {
  background-color: var(--color-primary-hover);
}
```

### Card Component
```css
.card {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
```

### Typography
```css
.heading-1 {
  font-size: var(--font-2xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--color-text);
}

.body {
  font-size: var(--font-base);
  line-height: var(--leading-normal);
  color: var(--color-text);
}

.caption {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}
```

---

## Maintenance

When updating tokens:

1. Update `src/styles/variables.css`
2. Document changes in this file
3. Update any components using hardcoded values
4. Test light and dark modes
5. Test on mobile viewports