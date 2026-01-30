# Frontend Agent Instructions

## Mobile-First Principles

**Design for:** iPhone 15 Pro (393px width)
**Touch targets:** 44x44px minimum
**Font size:** 16px minimum (prevents iOS zoom)
**Gestures:** Use framer-motion for swipes, drags

## Component Structure
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css
└── index.ts (export)
```

**Max 200 lines per component** - Split if larger

## CSS Modules + BEM

**Naming:** `ComponentName.module.css`

**Pattern:**
```css
/* Button.module.css */
.button { /* Block */ }
.button--primary { /* Modifier */ }
.button--disabled { /* Modifier */ }
.button__icon { /* Element */ }
```

**Usage:**
```tsx
import styles from './Button.module.css';
<button className={clsx(styles.button, styles['button--primary'])} />
```

## Styling Standards

**Use CSS variables:**
```css
.card {
  padding: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-md);
}
```

**Transitions:**
```css
transition: all var(--transition-normal);
```

**Z-index scale:**
```css
--z-dropdown: 1000;
--z-sheet: 2000;
--z-fab: 3000;
--z-menu: 4000;
```

## Navigation Patterns

**Top-left corner:**
- Home page: Menu button (opens slide-in menu to 80% width)
- Other pages: Back button (based on depth, not history)

**Top-right corner:**
- More button (dropdown menu, page-specific actions)
- Info button (to left of more, opens stats sheet if applicable)

**Bottom center:**
- FAB: Tap = command center (quick capture/search)
- FAB: Hold + drag = navigate to strategy|knowledge|execution

**Slide menu:**
- 3 sections: Strategy, Knowledge, Execution
- Full height, 80% width
- Swipe or tap outside to dismiss

## Radix UI Usage

**Always wrap primitives:**
```tsx
// src/components/ui/Button/Button.tsx
import * as RadixButton from '@radix-ui/react-button';
import styles from './Button.module.css';

export function Button({ variant = 'primary', children, ...props }) {
  return (
    <RadixButton.Root 
      className={clsx(styles.button, styles[`button--${variant}`])}
      {...props}
    >
      {children}
    </RadixButton.Root>
  );
}
```

**Common components to wrap:**
- Dialog → Sheet
- DropdownMenu → Dropdown
- Popover → Popover
- Checkbox → Checkbox
- Switch → Switch

## Gestures (framer-motion)

**Swipe navigation:**
```tsx
import { motion } from 'framer-motion';

<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, { offset }) => {
    if (offset.x > 100) navigateBack();
  }}
>
```

**Pull-to-refresh:**
```tsx
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  onDragEnd={(e, { offset }) => {
    if (offset.y > 80) triggerSync();
  }}
>
```

**FAB drag-to-navigate:**
```tsx
<motion.button
  drag
  dragConstraints={containerRef}
  whileTap={{ scale: 0.9 }}
  onDragEnd={handleDragToZone}
/>
```

## Optimistic UI Pattern
```tsx
const handleToggle = async (taskId: string) => {
  // 1. Haptic feedback
  navigator.vibrate(10);
  
  // 2. Update UI immediately
  const task = await db.tasks.findOne(taskId).exec();
  await task.patch({ completed: !task.completed });
  
  // 3. Sync happens automatically in background
  // 4. No loading spinner, no await
};
```

## Loading States

**Use skeleton screens:**
```tsx
// ❌ Bad
{isLoading && <Spinner />}

// ✅ Good  
{isLoading ? <TaskSkeleton /> : <TaskList />}
```

**Progressive loading:**
```tsx
// Show cached data immediately
const tasks = useRxQuery(db.tasks.find());

// Sync in background, UI updates automatically
useEffect(() => {
  triggerBackgroundSync();
}, []);
```

## Accessibility

**Touch targets:**
```css
.button {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
}
```

**ARIA labels:**
```tsx
<button aria-label="Delete task">
  <TrashIcon />
</button>
```

**Focus states:**
```css
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Haptic Feedback

**Add to interactions:**
```typescript
// Tap button
navigator.vibrate(10);

// Complete action
navigator.vibrate([10, 50, 10]);

// Error
navigator.vibrate([50, 100, 50]);
```

## Dynamic Imports

**For heavy components:**
```tsx
const CodeMirror = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />
});
```

## Form Handling

**Use react-hook-form:**
```tsx
const { register, handleSubmit } = useForm<FormData>();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('title', { required: true })} />
</form>
```