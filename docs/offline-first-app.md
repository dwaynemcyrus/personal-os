**Perfect clarifications. Let me write this out for Codex CLI.**

---

# **NAVIGATION.md**

```markdown
# Navigation Architecture

**CRITICAL:** This is a single-page app (SPA) with NO Next.js routing. All navigation is handled via overlapping sheets/panels. This follows the Bear app UI/UX pattern.

## Core Principles

1. **Single Route:** Everything happens at `/` (no dynamic routes)
2. **Sheet-Based Navigation:** All views are overlapping sheets/panels
3. **Offline-First:** No URL changes, no route fetching, pure client-side state
4. **Mobile-First:** Designed for iPhone, scales up to desktop
5. **Private/Personal:** No sharing features, no public URLs needed

---

## Navigation Layers

```
Layer 1: Today (Base - Always visible underneath)
Layer 2: Context Picker (Full-screen overlay, appears on FAB hold)
Layer 3: Context Menu (Full-screen sheet for Execution/Knowledge/Strategy)
Layer 4+: Nested Views (Lists, Detail views, stacked on top)
```

### Visual Layer Stack

```
┌─────────────────────────────────────┐
│ Task Detail                          │  ← Layer 5 (if open)
├─────────────────────────────────────┤
│ Tasks List                           │  ← Layer 4 (if open)
├─────────────────────────────────────┤
│ Execution Menu                       │  ← Layer 3 (if open)
├─────────────────────────────────────┤
│ Context Picker                       │  ← Layer 2 (if active)
├─────────────────────────────────────┤
│ Today (Home)                         │  ← Layer 1 (Always rendered)
└─────────────────────────────────────┘
       FAB (Always visible)
```

---

## Navigation State Machine

The app has ONE active view at any time, represented by a state object:

```typescript
type NavigationState = 
  // Base
  | { view: 'today' }
  | { view: 'context-picker' }
  
  // Execution Context
  | { view: 'execution-menu' }
  | { view: 'execution-tasks' }
  | { view: 'execution-task-detail', taskId: string }
  | { view: 'execution-projects' }
  | { view: 'execution-project-detail', projectId: string }
  | { view: 'execution-habits' }
  | { view: 'execution-timer' }
  
  // Knowledge Context
  | { view: 'knowledge-menu' }
  | { view: 'knowledge-notes' }
  | { view: 'knowledge-note-detail', noteId: string }
  | { view: 'knowledge-reader' }
  | { view: 'knowledge-reader-detail', contentId: string }
  
  // Strategy Context
  | { view: 'strategy-menu' }
  | { view: 'strategy-goals' }
  | { view: 'strategy-goal-detail', goalId: string }
  | { view: 'strategy-reviews' }
  
  // Global
  | { view: 'command-center' } // Opened by FAB tap
```

**Navigation history is tracked separately** for back button support.

---

## FAB (Floating Action Button) Behavior

The FAB is center-bottom, always visible, and has TWO distinct actions:

### TAP FAB
Opens **Command Center** (global sheet)
- Quick capture (create task, note, etc.)
- Global search across ALL data (tasks, notes, projects, habits, goals)
- Recently accessed items

### HOLD FAB
Shows **Context Picker** (full-screen overlay with 3 zones)
- User drags FAB to a zone OR taps a zone
- Opens that context's menu
- Releasing outside zones cancels

---

## User Flows

### Flow 1: Basic Navigation (Today → Execution → Tasks → Task Detail)

```
1. USER STARTS AT: Today View (Layer 1)
   ┌─────────────────────────────────────┐
   │ ☰ Menu    TODAY         ⓘ ⋮        │
   ├─────────────────────────────────────┤
   │ TASKS DUE TODAY                     │
   │ ☐ Write blog post                   │
   │ ☐ Review PRs                        │
   │                                     │
   │ HABITS                              │
   │ ☑ Exercise                          │
   │                                     │
   │             (●)                     │  ← FAB
   └─────────────────────────────────────┘

2. USER HOLDS FAB
   → Context Picker appears (Layer 2 overlays Today)
   ┌─────────────────────────────────────┐
   │        EXECUTION                    │  ← Zone 1
   │    ┌───────────────┐                │
   │    │ 📋 Tasks      │                │
   │    │ ✓ Habits      │                │
   │    │ 📁 Projects   │                │
   │    │ ⏱ Timer       │                │
   │    └───────────────┘                │
   │        KNOWLEDGE                    │  ← Zone 2
   │    ┌───────────────┐                │
   │    │ 📝 Notes      │                │
   │    │ 📖 Reader     │                │
   │    └───────────────┘                │
   │        STRATEGY                     │  ← Zone 3
   │    ┌───────────────┐                │
   │    │ 🎯 Goals      │                │
   │    │ 📊 Reviews    │                │
   │    └───────────────┘                │
   │             (●)  ← Draggable FAB    │
   └─────────────────────────────────────┘
   
   Today View dimmed underneath

3. USER DRAGS FAB TO "EXECUTION" (or taps zone)
   → Execution Menu opens (Layer 3 replaces Context Picker)
   ┌─────────────────────────────────────┐
   │ ←  EXECUTION                    ⋮   │  ← Back to Today
   ├─────────────────────────────────────┤
   │ MENU                                │
   │ ┌─────────────────────────────────┐│
   │ │ 📋 Tasks                        ││
   │ │    23 active • 3 due today      ││
   │ └─────────────────────────────────┘│
   │ ┌─────────────────────────────────┐│
   │ │ 📁 Projects                     ││
   │ │    5 active                     ││
   │ └─────────────────────────────────┘│
   │ ┌─────────────────────────────────┐│
   │ │ ✓ Habits                        ││
   │ │    2/4 complete today           ││
   │ └─────────────────────────────────┘│
   │ ┌─────────────────────────────────┐│
   │ │ ⏱ Timer                         ││
   │ │    Active: 01:23:45             ││
   │ └─────────────────────────────────┘│
   │             (●)                     │
   └─────────────────────────────────────┘

4. USER TAPS "Tasks"
   → Tasks List opens (Layer 4 on top of Execution Menu)
   ┌─────────────────────────────────────┐
   │ ←  Tasks                        + ⋮ │  ← Back to menu
   ├─────────────────────────────────────┤
   │ 🔍 Search tasks...                  │
   │                                     │
   │ DUE TODAY (3)                       │
   │ ☐ Write blog post                   │
   │ ☐ Review PRs                        │
   │                                     │
   │ THIS WEEK (12)                      │
   │ ☐ Design new feature                │
   │                                     │
   │             (●)                     │
   └─────────────────────────────────────┘

5. USER TAPS "Write blog post"
   → Task Detail opens (Layer 5 on top of Tasks List)
   ┌─────────────────────────────────────┐
   │ ←  Write blog post              ⋮   │  ← Back to list
   ├─────────────────────────────────────┤
   │ ☐ Write blog post                   │
   │                                     │
   │ 📁 Project: Blog Content            │
   │ 📅 Due: Today                       │
   │ ⏱ Time: 1h 23m                     │
   │                                     │
   │ DESCRIPTION                         │
   │ Write about offline-first...        │
   │                                     │
   │ [Start Timer] [Complete] [Delete]   │
   │             (●)                     │
   └─────────────────────────────────────┘
```

### Navigation Stack at This Point:
```
Layer 5: Task Detail
Layer 4: Tasks List
Layer 3: Execution Menu
Layer 1: Today (always underneath)
```

**Back navigation:**
- Tap ← on Task Detail → Back to Tasks List
- Tap ← on Tasks List → Back to Execution Menu
- Tap ← on Execution Menu → Back to Today
- OR Swipe RIGHT at any level → Go back one level

---

### Flow 2: Switching Contexts

```
USER IS AT: Execution > Tasks List (Layer 4)

USER HOLDS FAB
→ Context Picker appears (Layer 2 overlays current view)

USER DRAGS TO "KNOWLEDGE"
→ Knowledge Menu opens (Layer 3)
→ OLD STACK IS DISCARDED (Execution menu and Tasks list unmounted)
→ New stack begins: Knowledge Menu

Navigation Stack Now:
Layer 3: Knowledge Menu
Layer 1: Today
```

**Key behavior:** Switching contexts **clears the old navigation stack**.

---

### Flow 3: Command Center (Global Search)

```
USER IS ANYWHERE (Today, or deep in Execution > Tasks > Detail)

USER TAPS FAB (not hold, just tap)
→ Command Center opens (full-screen sheet)

┌─────────────────────────────────────┐
│ ×  Command Center                   │
├─────────────────────────────────────┤
│ 🔍 Search or create...              │  ← Auto-focused input
├─────────────────────────────────────┤
│                                     │
│ QUICK ACTIONS                       │
│ ┌─────────────────────────────────┐│
│ │ + New Task                      ││
│ │ + New Note                      ││
│ │ + New Project                   ││
│ └─────────────────────────────────┘│
│                                     │
│ RECENT                              │
│ • Task: Review PRs                 │
│ • Note: React Hooks                │
│ • Project: Website Redesign        │
└─────────────────────────────────────┘

USER TYPES: "design"
→ Global search runs across ALL collections

┌─────────────────────────────────────┐
│ ×  Command Center                   │
├─────────────────────────────────────┤
│ 🔍 design                           │
├─────────────────────────────────────┤
│ RESULTS                             │
│                                     │
│ TASKS (2)                           │
│ ☐ Document design system           │
│ ☐ Update design tokens             │
│                                     │
│ NOTES (3)                           │
│ 📝 Design System Architecture      │
│ 📝 Component Library               │
│                                     │
│ PROJECTS (1)                        │
│ 📁 Design System v2                │
└─────────────────────────────────────┘

USER TAPS a result
→ Command Center closes
→ Opens detail view for that item (in appropriate context)
```

**Command Center is context-agnostic** - works from anywhere, searches everything.

---

## Gesture Reference

| Gesture | Action | Context |
|---------|--------|---------|
| **Tap FAB** | Open Command Center | Any view |
| **Hold FAB (500ms)** | Show Context Picker | Any view |
| **Drag FAB to zone** | Open that context | Context Picker active |
| **Tap ← button** | Go back one level | Any sheet with back button |
| **Swipe RIGHT** | Go back one level | Any sheet (except Today) |
| **Swipe DOWN on sheet** | Close sheet, go back | Any sheet |
| **Tap outside Context Picker** | Cancel, stay on current view | Context Picker active |

---

## Browser Back Button Handling

**CRITICAL:** The browser back button must work intuitively.

### Implementation Requirements:

1. **Push history state when opening sheets:**
   ```typescript
   window.history.pushState({ view: 'execution-tasks' }, '', '#execution-tasks');
   ```

2. **Listen for popstate events:**
   ```typescript
   window.addEventListener('popstate', (e) => {
     if (e.state?.view) {
       navigateTo(e.state.view);
     } else {
       // No state = back to Today
       navigateTo('today');
     }
   });
   ```

3. **Navigation stack matches history stack**

**User presses browser back button:**
```
At: Task Detail → Back to Tasks List
At: Tasks List → Back to Execution Menu
At: Execution Menu → Back to Today
At: Today → Exit app (or show "no history" state)
```

---

## State Persistence

**On page refresh, restore navigation state:**

```typescript
// Save to localStorage on every navigation
localStorage.setItem('nav-state', JSON.stringify({
  view: 'execution-task-detail',
  taskId: '550e8400...',
  stack: ['today', 'execution-menu', 'execution-tasks']
}));

// Restore on app load
const savedState = localStorage.getItem('nav-state');
if (savedState) {
  const state = JSON.parse(savedState);
  // Reopen sheets to restore exact position
  reopenNavigationStack(state);
}
```

**User refreshes page in middle of editing a task** → App reopens at that exact task.

---

## Animation Guidelines

### Sheet Transitions

**Opening sheet (bottom to top):**
```css
initial: { y: '100%' }
animate: { y: 0 }
transition: { type: 'spring', damping: 30, stiffness: 300 }
```

**Closing sheet (top to bottom):**
```css
exit: { y: '100%' }
```

**Context Picker (fade + scale):**
```css
initial: { opacity: 0, scale: 0.95 }
animate: { opacity: 1, scale: 1 }
exit: { opacity: 0, scale: 0.95 }
transition: { duration: 0.2 }
```

**Today dimming when sheet opens:**
```css
.today--dimmed {
  filter: brightness(0.6) blur(4px);
  transition: filter 0.3s ease;
}
```

### Performance Requirements

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Never animate `height`, `width`, `top`, `left` (causes reflow)
- Unmount closed sheets (don't keep in DOM hidden)
- Max animation duration: 300ms

---

## Component Architecture

### File Structure

```
src/
├── app/
│   └── page.tsx                    ← Single route, renders <AppShell />
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            ← Manages all navigation state & sheets
│   │   ├── Sheet.tsx               ← Reusable sheet wrapper with animations
│   │   ├── FAB.tsx                 ← FAB with tap/hold detection
│   │   ├── ContextPicker.tsx       ← 3-zone drag target overlay
│   │   └── CommandCenter.tsx       ← Global search/quick capture
│   └── ui/
│       └── ... (Button, Input, etc.)
├── features/
│   ├── today/
│   │   └── TodayView.tsx
│   ├── execution/
│   │   ├── ExecutionMenu.tsx       ← Context menu
│   │   ├── TasksList.tsx
│   │   ├── TaskDetail.tsx
│   │   ├── ProjectsList.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── HabitsList.tsx
│   │   └── Timer.tsx
│   ├── knowledge/
│   │   ├── KnowledgeMenu.tsx
│   │   ├── NotesList.tsx
│   │   ├── NoteDetail.tsx          ← Includes CodeMirror editor
│   │   ├── ReaderList.tsx
│   │   └── ReaderDetail.tsx
│   └── strategy/
│       ├── StrategyMenu.tsx
│       ├── GoalsList.tsx
│       ├── GoalDetail.tsx
│       └── Reviews.tsx
├── lib/
│   ├── navigation.ts               ← Navigation state machine & reducer
│   └── ...
└── hooks/
    ├── useNavigation.ts            ← Hook to access navigation state
    └── useBackButton.ts            ← Hook for back gesture handling
```

### AppShell Component (Core Navigation Controller)

```typescript
// src/components/layout/AppShell.tsx
'use client';

import { useReducer, useEffect } from 'react';
import { NavigationState, navigationReducer } from '@/lib/navigation';
import { TodayView } from '@/features/today/TodayView';
import { ContextPicker } from './ContextPicker';
import { ExecutionMenu } from '@/features/execution/ExecutionMenu';
import { TasksList } from '@/features/execution/TasksList';
// ... import all other views

export function AppShell() {
  const [navState, dispatch] = useReducer(navigationReducer, { view: 'today' });
  
  // Browser back button handling
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        dispatch({ type: 'NAVIGATE', payload: e.state });
      } else {
        dispatch({ type: 'NAVIGATE', payload: { view: 'today' } });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  // Persist navigation state
  useEffect(() => {
    localStorage.setItem('nav-state', JSON.stringify(navState));
  }, [navState]);
  
  return (
    <NavigationContext.Provider value={{ navState, dispatch }}>
      <div className="app-shell">
        {/* Layer 1: Always rendered */}
        <TodayView isActive={navState.view === 'today'} />
        
        {/* Layer 2: Context Picker */}
        {navState.view === 'context-picker' && (
          <ContextPicker onSelectContext={(ctx) => 
            dispatch({ type: 'OPEN_CONTEXT', payload: ctx })
          } />
        )}
        
        {/* Layer 3+: Context-specific sheets */}
        {navState.view.startsWith('execution-') && (
          <ExecutionSheet navState={navState} dispatch={dispatch} />
        )}
        
        {navState.view.startsWith('knowledge-') && (
          <KnowledgeSheet navState={navState} dispatch={dispatch} />
        )}
        
        {navState.view.startsWith('strategy-') && (
          <StrategySheet navState={navState} dispatch={dispatch} />
        )}
        
        {/* Global: Command Center */}
        {navState.view === 'command-center' && (
          <CommandCenter onClose={() => dispatch({ type: 'CLOSE_COMMAND_CENTER' })} />
        )}
        
        {/* FAB: Always visible */}
        <FAB
          onTap={() => dispatch({ type: 'OPEN_COMMAND_CENTER' })}
          onHold={() => dispatch({ type: 'OPEN_CONTEXT_PICKER' })}
        />
      </div>
    </NavigationContext.Provider>
  );
}
```

### Navigation State Machine

```typescript
// src/lib/navigation.ts

export type NavigationState = 
  | { view: 'today' }
  | { view: 'context-picker' }
  | { view: 'execution-menu' }
  | { view: 'execution-tasks' }
  | { view: 'execution-task-detail', taskId: string }
  // ... all other states

type NavigationAction =
  | { type: 'NAVIGATE', payload: NavigationState }
  | { type: 'GO_BACK' }
  | { type: 'OPEN_CONTEXT_PICKER' }
  | { type: 'OPEN_CONTEXT', payload: 'execution' | 'knowledge' | 'strategy' }
  | { type: 'OPEN_COMMAND_CENTER' }
  | { type: 'CLOSE_COMMAND_CENTER' };

const history: NavigationState[] = [];

export function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  switch (action.type) {
    case 'NAVIGATE':
      history.push(state);
      window.history.pushState(action.payload, '', `#${action.payload.view}`);
      return action.payload;
      
    case 'GO_BACK':
      const previous = history.pop();
      if (previous) {
        window.history.back();
        return previous;
      }
      return { view: 'today' };
      
    case 'OPEN_CONTEXT_PICKER':
      return { view: 'context-picker' };
      
    case 'OPEN_CONTEXT':
      // Clear old context stack when switching
      history.length = 0;
      return { view: `${action.payload}-menu` as any };
      
    // ... other actions
  }
}
```

---

## Testing Checklist

**Navigation must pass these tests:**

### Gesture Tests
- [ ] Tap FAB → Command Center opens
- [ ] Hold FAB (500ms) → Context Picker appears
- [ ] Drag FAB to zone → Context opens
- [ ] Tap outside Context Picker → Closes, stays on current view
- [ ] Swipe right on sheet → Goes back one level
- [ ] Swipe down on sheet → Closes sheet

### Back Navigation Tests
- [ ] Browser back button works at all levels
- [ ] ← button works at all levels
- [ ] Today → Context → List → Detail → Back → Back → Back → Today
- [ ] Switching contexts clears old stack

### State Persistence Tests
- [ ] Refresh on Today → Stays on Today
- [ ] Refresh on Task Detail → Reopens at Task Detail
- [ ] Close browser → Reopen → Restores last position

### Offline Tests
- [ ] All navigation works offline
- [ ] Sheets open instantly (no loading states)
- [ ] Command Center search works offline

### Animation Tests
- [ ] No jank on sheet open/close
- [ ] Smooth transitions (60fps)
- [ ] No layout shift during animations
- [ ] Works on low-end devices

---

## Critical Implementation Notes

### DO:
✅ Use single route (`/`)
✅ Manage state with reducer (Zustand or useReducer)
✅ Unmount closed sheets (don't hide with CSS)
✅ Handle browser back button
✅ Persist navigation state to localStorage
✅ Use GPU-accelerated animations (transform, opacity)
✅ Clear context stack when switching contexts
✅ Auto-focus inputs when sheets open
✅ Return focus to FAB when sheets close

### DON'T:
❌ Use Next.js dynamic routes (`/tasks/[id]`)
❌ Use `useRouter()` for navigation
❌ Keep all sheets mounted and toggle visibility
❌ Animate height/width/top/left
❌ Preserve context stack when switching contexts
❌ Allow horizontal scrolling to conflict with swipe-back gesture
❌ Forget to handle browser back button

---

## Example Component: Sheet Wrapper

```typescript
// src/components/layout/Sheet.tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import FocusTrap from 'focus-trap-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function Sheet({ isOpen, onClose, children, title }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Handle swipe down to close
  useEffect(() => {
    if (!isOpen) return;
    
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 100) {
        onClose();
      }
    };
    
    const sheet = sheetRef.current;
    sheet?.addEventListener('touchstart', handleTouchStart);
    sheet?.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      sheet?.removeEventListener('touchstart', handleTouchStart);
      sheet?.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <FocusTrap active={isOpen}>
      <motion.div
        ref={sheetRef}
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <div className="sheet__header">
          <button onClick={onClose} className="sheet__back">←</button>
          {title && <h1 className="sheet__title">{title}</h1>}
        </div>
        <div className="sheet__content">
          {children}
        </div>
      </motion.div>
    </FocusTrap>
  );
}
```

---

## Summary for Codex CLI

**This app:**
- Has ONE route (`/`)
- Uses overlapping sheets for ALL navigation (no URL routing)
- Follows Bear app UX pattern
- Is mobile-first, offline-first, single-user
- Has NO sharing features (private/personal only)
- Uses FAB for two distinct actions: tap (command center) and hold (context picker)
- Switches between three main contexts: Execution, Knowledge, Strategy
- Each context has a menu → list → detail hierarchy
- Back navigation works via: browser back button, ← button, or swipe right gesture
- Navigation state persists across page refreshes

**When building, remember:**
- This is NOT a traditional Next.js app with routes
- ALL views are React components conditionally rendered
- State management is critical (use Zustand or useReducer)
- Animations must be performant (GPU-accelerated)
- Browser back button MUST work correctly
```

---

**This document should give Codex CLI everything it needs to understand and build the navigation system. Want me to create similar detailed docs for other aspects (data layer, sync, component patterns)?**