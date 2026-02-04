# Component Inventory

Track all UI components to avoid duplication and maintain consistency.

**Last updated:** February 4, 2026

---

## Status Legend

- ✅ **Completed** - Built, tested, documented
- 🚧 **In Progress** - Currently being developed
- ⏳ **Planned** - Designed but not started
- ❌ **Blocked** - Waiting on dependency

---

## UI Components (src/components/ui/)

Wrappers around Radix primitives with consistent styling.

### Buttons & Actions
- [ ] ⏳ Button - Primary, secondary, ghost, danger variants
- [ ] ⏳ IconButton - Square button for icons only
- [ ] ⏳ FAB - Floating action button (large, prominent)

### Forms
- [ ] ⏳ Input - Text input with validation states
- [ ] ⏳ Textarea - Multi-line text input
- [ ] ⏳ Checkbox - Toggle checkbox with label
- [ ] ⏳ Switch - iOS-style toggle switch
- [ ] ⏳ Select - Dropdown select menu
- [ ] ⏳ Radio - Radio button group

### Overlays
- [ ] ⏳ Sheet - Bottom sheet modal (mobile-optimized)
- [ ] ⏳ Dialog - Centered dialog/modal
- [x] ✅ Dropdown - Dropdown menu for actions
- [ ] ⏳ Popover - Floating content container
- [ ] ⏳ Toast - Temporary notification

### Navigation
- [ ] ⏳ Tabs - Horizontal tab navigation
- [ ] ⏳ Breadcrumbs - Hierarchical navigation

### Feedback
- [ ] ⏳ Skeleton - Loading placeholder
- [ ] ⏳ Spinner - Loading indicator (use sparingly)
- [ ] ⏳ ProgressBar - Linear progress indicator
- [ ] ⏳ Badge - Status indicator or count

### Data Display
- [ ] ⏳ Card - Container for related content
- [ ] ⏳ List - Vertical list with dividers
- [ ] ⏳ EmptyState - Placeholder when no data
- [ ] ⏳ Avatar - User or entity image/icon

### Utilities
- [ ] ⏳ Tooltip - Hover/focus hint text
- [ ] ⏳ Separator - Visual divider line

---

## Layout Components (src/components/layout/)

Core app structure and navigation.

- [ ] ⏳ AppShell - Main layout wrapper with safe areas
- [ ] ⏳ TopBar - Header with back/menu, title, info/more buttons
- [ ] ⏳ FAB - Floating action button (center bottom)
- [ ] ⏳ SlideMenu - Side menu (80% width, 3 sections)
- [ ] ⏳ BottomSheet - Modal from bottom (for mobile)
- [ ] ⏳ CommandCenter - Quick capture/search overlay

---

## Feature Components

Domain-specific components for each feature area.

### Timer (src/features/timer/)
- [ ] ⏳ Timer - Active timer display with elapsed time
- [ ] ⏳ TimerControls - Start/stop buttons
- [ ] ⏳ TimeEntryList - List of completed time entries
- [ ] ⏳ TimeEntryCard - Single time entry display

### Tasks (src/features/tasks/)
- [ ] ⏳ TaskList - List of tasks with checkboxes
- [ ] ⏳ TaskItem - Single task row (swipeable)
- [ ] ⏳ TaskForm - Create/edit task form
- [ ] ⏳ TaskDetail - Full task view with time entries
- [ ] ⏳ TaskFilters - Filter tasks (all, active, completed)

### Projects (src/features/projects/)
- [ ] ⏳ ProjectList - Grid/list of projects
- [ ] ⏳ ProjectCard - Project summary card
- [ ] ⏳ ProjectDetail - Project view with tasks
- [ ] ⏳ ProjectForm - Create/edit project form
- [ ] ⏳ ProjectStats - Time spent, task counts

### Notes (src/features/notes/)
- [ ] ⏳ NotesList - List of notes (title, preview)
- [ ] ⏳ NoteCard - Single note preview
- [ ] ⏳ NoteEditor - Rich text editor (CodeMirror)
- [ ] ⏳ NoteToolbar - Editor formatting controls
- [ ] ⏳ NoteInfo - Word count, dates

### Habits (src/features/habits/)
- [ ] ⏳ HabitList - List of habits with check buttons
- [ ] ⏳ HabitCard - Single habit with today's status
- [ ] ⏳ HabitForm - Create/edit habit form
- [ ] ⏳ HabitCalendar - 7-day completion view
- [ ] ⏳ HabitStats - Streak, completion rate

---

## Shared Components (src/components/shared/)

Reusable across multiple features.

- [ ] ⏳ SyncIndicator - Shows sync status (syncing, offline, error)
- [ ] ⏳ OfflineBanner - "You're offline" warning
- [ ] ⏳ ErrorBoundary - Catches React errors
- [ ] ⏳ ConfirmDialog - "Are you sure?" confirmation
- [ ] ⏳ DatePicker - Select date (mobile-friendly)
- [ ] ⏳ TimePicker - Select time (mobile-friendly)

---

## Gestures & Interactions

Components with gesture support (framer-motion).

- [ ] ⏳ SwipeableItem - Swipe to reveal actions
- [ ] ⏳ PullToRefresh - Pull down to sync
- [ ] ⏳ DraggableFAB - Drag to navigate
- [ ] ⏳ SwipeBack - Swipe right to go back

---

## Icons

Using which icon library?

**Options:**
- Lucide React (recommended - lightweight, consistent)
- Heroicons
- Radix Icons (minimal set)

**Decision:** TBD

---

## Component Template

When creating new components, use this structure:
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css
├── ComponentName.test.tsx (optional)
└── index.ts
```

**ComponentName.tsx:**
```tsx
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Props
}

export function ComponentName({ ...props }: ComponentNameProps) {
  return (
    <div className={styles.component}>
      {/* Implementation */}
    </div>
  );
}
```

**index.ts:**
```ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

---

## Design Patterns

### Consistent Props

All components should accept:
```tsx
interface BaseProps {
  className?: string;      // Allow style overrides
  'data-testid'?: string; // For testing
}
```

### Accessibility

All interactive components must have:
- Proper ARIA labels
- Keyboard navigation
- Focus states
- Touch targets ≥44px

### Mobile-First

All components designed for:
- iPhone 15 Pro (393px) first
- Scale up for tablet/desktop
- Touch-friendly interactions
- Haptic feedback where appropriate

---

## Component Checklist

Before marking component complete:

- [ ] TypeScript types defined
- [ ] CSS Module with BEM naming
- [ ] Mobile-optimized (393px viewport)
- [ ] Touch targets ≥44px
- [ ] Accessible (ARIA, keyboard nav)
- [ ] Dark mode support
- [ ] Documented in Storybook/docs (optional)
- [ ] Used in at least one page

---

## Future Components

Ideas for later phases:

- [ ] SearchBar - Full-text search across all content
- [ ] FilterPanel - Advanced filtering UI
- [ ] ChartCard - Visualizations (time spent, habits)
- [ ] NotificationCenter - In-app notifications
- [ ] SettingsPanel - App preferences
- [ ] ExportDialog - Export data as JSON/CSV
- [ ] ImportDialog - Import data from file
- [ ] KeyboardShortcuts - Show available shortcuts
- [ ] OnboardingFlow - First-time user guide

---

## Notes

- Keep components small (<200 lines)
- Extract sub-components if growing too large
- Prefer composition over complex props
- Use Radix primitives for accessibility
- Always test on mobile device
