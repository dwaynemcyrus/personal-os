# Visual Aesthetic Spec (viz.md)

This document captures the visual aesthetics of the current app so it can be replicated
in another app. It combines design guidance (principles + tokens) with copy-ready code
snippets (CSS + minimal HTML structure). It intentionally focuses on system-level
foundations and reusable patterns first, then lists page-level exceptions.

If you need 1:1 fidelity, follow the Foundations + Core Patterns sections and then
apply the Page Exceptions section only where needed.

---

## 1) Visual DNA
- Tone: warm, calm, paper-like surfaces with dark ink.
- Contrast: high legibility with soft neutrals; avoid saturated colors except for status.
- Shape language: rounded rectangles, pill buttons, soft corners.
- Depth: minimal; soft shadows on hover, modals, and key emphasis elements.
- Motion: subtle; quick ease transitions (160ms), rare animations.

---

## 2) Foundations (Design Tokens)
These values are directly derived from the current codebase. The app does not
centralize all tokens yet, but use these values to replicate the look.

**Token source:** `docs/xfer/tokens.css` (copy into your app or map to your token system).

### 2.1 Color Palette
**Base backgrounds**
- Paper base: #f6f2ea
- Surface: #fcfbf8
- Pure white: #ffffff / #fff

**Ink / text**
- Primary ink: #14110f
- Secondary ink: #5a4f45 (common), #6a5f54, #6a5d52
- Muted ink: #8a7f73
- Deep neutral: #3b3227 / #3b342c

**Borders / separators**
- Default border: rgba(20, 17, 15, 0.12)
- Stronger border: rgba(20, 17, 15, 0.2) to rgba(20, 17, 15, 0.4)
- Dashed neutral: #c8bfb1 (and #e1d4be for softer warning borders)

**Status colors**
- Error ink: #7b1b1b / #b3261e
- Error background: #fffaf8 / #fef2f2
- Error border: #fecaca or rgba(120, 24, 24, 0.25)
- Warning ink: #8a6914
- Warning background: #fff6df
- Success ink: #2b6b3f
- Success background: rgba(43, 107, 63, 0.1) or #e8f4e8

**Highlights**
- Search highlight: rgba(255, 209, 102, 0.55)

**Gradient exceptions**
- Focus page: radial-gradient(circle at top, #fbf7ef 0%, #f5efe6 50%, #efe7db 100%)
- Login page: linear-gradient(160deg, #f6f2ea 0%, #f2ede4 50%, #ede7dd 100%)

### 2.2 Typography
- Primary font: New Atten (loaded via next/font/local)
- Weights available: 350, 400, 500, 700, 800 (plus italics)
- Fallbacks: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif

**Type scale (common usage)**
- 32px: primary page titles (Home/Command/Now)
- 28px: section/page titles (Notes, Inbox, Settings, Logbook)
- 24px: login heading
- 18px: panel titles
- 16px: body, list items, inputs
- 14px: helper text, secondary text
- 12-13px: labels, meta, uppercase labels
- 64px: focus timer digits

**Letter spacing**
- Titles: -0.02em (tight, modern)
- Uppercase labels: 0.04em to 0.2em

### 2.3 Spacing Scale
Common increments (in px): 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32.
Primary page padding is 24px (20px on small screens).

### 2.4 Radius Scale
- Small: 8px
- Medium: 10px, 12px
- Large: 14px, 16px, 18px, 20px
- Pill: 999px

### 2.5 Shadows / Elevation
- FAB: 0 12px 24px rgba(20, 17, 15, 0.28)
- Modals: 0 10px 40px rgba(20, 17, 15, 0.25)
- Menu panel: 0 16px 32px rgba(20, 17, 15, 0.2)
- Timer card: 0 18px 36px rgba(20, 17, 15, 0.25)
- Toasts: 0 4px 20px rgba(20, 17, 15, 0.2)
- Hover cards: 0 4px 12px rgba(20, 17, 15, 0.08)

### 2.6 Motion
- Default transition: 160ms ease (border, background, color)
- Press feedback: 100ms ease scale(0.98) for primary buttons
- Spinner: 0.8s linear infinite
- Toast entrance: 180ms ease-out

### 2.7 Focus states
- Focus ring: 2px solid #14110f, offset 2px
- On dark surfaces: 2px solid #f6f2ea

### 2.8 Token usage map (quick reference)
- Page canvas: `--color-paper` background, `--color-ink-900` primary text, `--color-ink-500/400/300` secondary text.
- Surface cards: `--color-surface` background, `--color-border-200` border, `--radius-14` radius, `--shadow-hover` on hover.
- Subtle panels/washes: `--color-ink-alpha-03/06/08/10` for low-contrast fills (stats, banners, segmented controls).
- Primary buttons: `--color-ink-900` background, `--color-paper` text, `--radius-pill` radius, `--duration-160` transitions.
- Secondary buttons: `--color-border-400` border, `--color-ink-900` text, transparent or `--color-surface` background.
- Danger buttons: `--color-error-ink` text and border; use `--color-error-bg` for banners.
- Inputs: `--color-white` background, `--color-border-300` border, `--color-border-600` focus, `--color-ink-alpha-08` focus ring.
- Modals: `--color-paper` surface, `--shadow-modal` elevation.
- Toasts: `--color-ink-900` background, `--color-paper` text, `--shadow-toast` elevation.
- FAB: `--color-ink-900` background, `--color-paper` text, `--shadow-fab`, `--radius-20`.
- Focus page: `--gradient-focus` background; timer card uses `--color-ink-900` + `--color-paper` with `--shadow-timer`.
- Login page: `--gradient-login` background; card uses `--color-surface`, `--color-border-200`, `--shadow-login`.
- Search highlights: `--color-highlight` background.

---

## 3) Layout Patterns
### 3.1 Base page container
- Background: #f6f2ea
- Content width: max-width 720px (centered)
- Padding: 24px (20px on <= 600px)
- Vertical rhythm: gap 20-28px

### 3.2 Shell overlay pattern
- Header and FAB live in an overlay layer above content.
- Content scrolls underneath.
- Safe-area aware padding top and bottom.

### 3.3 Editor layout
- Editor wraps with max width clamp: 640px to 760px
- Line height: 1.7
- Editor background is surface-like (#fcfbf8) when content is static

---

## 4) Core Components (Recipes)
These are the most common patterns. Use these as the building blocks for
replication rather than page-by-page CSS.

### 4.1 Cards (base)
```css
.card {
  background: #fcfbf8;
  border: 1px solid rgba(20, 17, 15, 0.12);
  border-radius: 14px;
  padding: 16px 18px;
}
```

### 4.2 Action card (list row with hover)
```css
.actionCard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-radius: 14px;
  background: #fcfbf8;
  border: 1px solid rgba(20, 17, 15, 0.12);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.actionCard:hover {
  border-color: rgba(20, 17, 15, 0.3);
  box-shadow: 0 4px 12px rgba(20, 17, 15, 0.08);
}
```

### 4.3 Buttons
**Primary (dark pill)**
```css
.buttonPrimary {
  border: none;
  background: #14110f;
  color: #f6f2ea;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
}
.buttonPrimary:disabled {
  opacity: 0.5;
}
```

**Secondary (outline pill)**
```css
.buttonSecondary {
  border: 1px solid rgba(20, 17, 15, 0.2);
  background: transparent;
  color: #14110f;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
}
```

**Danger (outline)**
```css
.buttonDanger {
  border: 1px solid rgba(120, 24, 24, 0.35);
  background: transparent;
  color: #7b1b1b;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
}
```

### 4.4 Inputs
```css
.input {
  border: 1px solid rgba(20, 17, 15, 0.15);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 16px;
  font-family: inherit;
  background: #fff;
  color: #14110f;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.input:focus {
  outline: none;
  border-color: rgba(20, 17, 15, 0.4);
  box-shadow: 0 0 0 3px rgba(20, 17, 15, 0.08);
}
```

### 4.5 Badges
```css
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 12px;
  background: #14110f;
  color: #f6f2ea;
  font-size: 13px;
  font-weight: 600;
}
```

### 4.6 Empty states
```css
.emptyState {
  border-radius: 16px;
  border: 1px dashed #c8bfb1;
  background: #fcfbf8;
  padding: 28px;
  color: #8a7f73;
  font-size: 14px;
  text-align: center;
}
```

### 4.7 Modals (sheet + centered)
**Backdrop**
```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 17, 15, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}
```

**Modal panel**
```css
.modal {
  width: 100%;
  max-width: 480px;
  background: #f6f2ea;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(20, 17, 15, 0.25);
}
```

### 4.8 Toasts
```css
.toast {
  position: fixed;
  left: 50%;
  top: max(48px, calc(env(safe-area-inset-top, 0px) + 16px));
  transform: translateX(-50%);
  background: #14110f;
  color: #f6f2ea;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.02em;
  box-shadow: 0 12px 24px rgba(20, 17, 15, 0.3);
}
```

### 4.9 Floating Action Button (FAB)
```css
.fab {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  border: none;
  background: #14110f;
  color: #f6f2ea;
  font-size: 22px;
  font-weight: 600;
  box-shadow: 0 12px 24px rgba(20, 17, 15, 0.28);
}
```

---

## 5) Page-level exceptions (only when needed)
### 5.1 Focus page
- Background uses a radial gradient (see palette).
- Timer card is the deepest elevation surface and uses inverted colors.
- Timer digits are oversized (64px) with wide letter spacing.

### 5.2 Login page
- Background uses a soft diagonal gradient.
- Central card with larger shadow and 20px radius.
- Toggle row uses uppercase and tight spacing.

### 5.3 Editor screen
- CodeMirror styles are customized to match the app palette.
- Line height 1.7, with subtle gutter styling.

---

## 6) Replication checklist
- Use the warm paper background (#f6f2ea) for all primary screens.
- Use #fcfbf8 for most surfaces and cards.
- Keep borders light and low-contrast (rgba(20,17,15,0.12)).
- Use pill buttons with strong contrast for primary actions.
- Apply subtle hover shadows, not heavy elevation.
- Preserve type sizes and uppercase label patterns.
- Use focus rings consistently (2px outline).
- Keep motion subtle and short (160ms).

---

## 7) Where to look in this repo
These files provide the exact current implementation:
- `src/app/globals.css`
- `src/components/shell/*.module.css`
- `src/styles/*.module.css`
- `src/app/login/page.module.css`
- `src/app/page.module.css`
