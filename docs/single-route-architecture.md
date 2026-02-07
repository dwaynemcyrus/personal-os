# Single-Route Architecture

Audience: product and engineering

## Purpose
This document explains the single-route, context-driven navigation model used in Personal OS. It covers the current implementation, how navigation state works, how sheets are stacked, how browser history is used, and what happens on deep links and refresh.

The goal is to keep the app feeling like a native mobile experience while preserving offline-first behavior and avoiding route churn for core interactions.

## High-Level Model
- The app renders a single top-level route ("Today") and swaps contexts in-place.
- Navigation state is managed by a small state machine with:
  - `context`: the active top-level area (`today`, `strategy`, `thoughts`, `execution`)
  - `stack`: a LIFO stack of overlay layers (sheets/modals)
- Context switches clear the stack to avoid orphaned overlays.

This is closer to a native app navigation stack than a URL-driven website.

## Core Navigation State
Source of truth:
- `src/lib/navigation/types.ts`
- `src/lib/navigation/reducer.ts`
- `src/hooks/useNavigation.ts`

State shape:
```
NavigationState {
  context: 'today' | 'execution' | 'thoughts' | 'strategy'
  stack: NavigationLayer[]
}
```

Key invariants:
- `switchContext()` always clears `stack`.
- `pushLayer()` adds a new overlay on top.
- `popLayer()` removes the last overlay.
- `goBack()` is a semantic alias for `popLayer()`.
- `resetToToday()` returns to the initial state.

## Rendering Flow
Entry point:
- `src/app/layout.tsx` wraps the app in `NavigationProvider` and `AppShell`.
- `src/app/page.tsx` renders `RootView`.

Root view routing:
- `src/app/_components/RootView.tsx` renders the view based on `context`.
- `ExecutionView`, `ThoughtsView`, `StrategyView` are lazy-loaded for performance.
- The default context is `today` (rendered inline in `RootView.tsx`).

Sheet overlays:
- `AppShell` contains a global `SheetManager` which maps `stack` layers to overlay components.
- Some detail sheets are still rendered inside their feature views (see "Known Gaps").

## Context Switching
Context changes are driven by `useNavigationActions()`:
- Menu in `AppShell` calls `switchContext()`.
- Long-press drag on the FAB triggers `switchContext()` via `openContext()`.
- Special handling: opening `thoughts` also pushes `thoughts-menu` and `thoughts-list` layers for the stacked sheet experience.

Because `switchContext()` clears `stack`, overlays are never carried across contexts.

## Layer Stack Model
`NavigationLayer` types are defined in `src/lib/navigation/types.ts`.

The stack represents a vertical overlay system:
- Sheets are stacked in order (`stack[0]` at the bottom, last item on top).
- Closing a sheet removes the top layer.
- `SheetManager` renders layers in `stack.map` order, allowing stacking by z-index.

Currently implemented in `SheetManager`:
- `thoughts-menu`
- `thoughts-list`
- `thoughts-note`

Currently implemented outside `SheetManager`:
- `task-detail` (rendered in `TaskList`)
- `project-detail` (rendered in `ProjectList`)

## Browser History Integration
`useNavigation()` integrates minimal browser history support:
- `pushLayer()` calls `window.history.pushState({},{})`.
- `popstate` events call `goBack()`.
- URLs do not change for layer pushes.

Implications:
- Browser Back is treated as a "close top sheet" action.
- Closing a sheet via UI does not pop browser history, so history is best-effort.
- Context switches do not push history, so browser Back does not traverse contexts.

## Deep Linking and Refresh
Current behavior:
- Refresh always resets to `context = 'today'` with an empty stack.
- There is no persisted navigation state in localStorage or URL.
- `/thoughts` exists as an entry point that sets `context = 'thoughts'` and pushes its sheets.
- Other URLs like `/strategy` and `/execution` are referenced in the PWA manifest but are not implemented routes yet.

Design intent:
- Keep URL stable for core interaction flows.
- Allow a small set of entry routes to seed initial context + stack (e.g., `/thoughts`).

Future deep-linking options:
- Add lightweight routes that only set initial `context` and `stack`.
- Encode stack state in query params (optional, likely not necessary for MVP).

## Offline/PWA Considerations
- Single-route model complements offline-first behavior by keeping all primary flows within one shell.
- Data access is local via RxDB; sync happens in the background (`src/lib/sync.ts`).
- The PWA uses `next-pwa` with `/offline` as a document fallback (`next.config.ts`).

## Known Gaps and Risks
- History vs stack can diverge because UI closes sheets without popping history.
- No persistence of navigation state across refresh or restart.
- Some overlay layers (task/project detail) are not centralized in `SheetManager` yet.
- Routes for `/strategy` and `/execution` are not implemented despite being in the manifest.

## Extension Points
To add a new top-level context:
1. Add the context to `NavigationContext` in `src/lib/navigation/types.ts`.
2. Add a view in `src/app/_components/RootView.tsx`.
3. Add a menu item in `src/components/layout/AppShell/AppShell.tsx`.

To add a new sheet layer:
1. Add a `NavigationLayer` type in `src/lib/navigation/types.ts`.
2. Render it in `src/components/layout/SheetManager/SheetManager.tsx`.
3. Push/pop it via `useNavigationActions()` from the feature component.

## Verification Checklist
Manual checks:
- Switch context via menu, ensure stack clears.
- Open stacked sheets (Thoughts) and use browser Back to close top layer.
- Refresh the page and confirm it returns to Today with no open layers.
- Load `/thoughts` and confirm it opens the Thoughts context with menu + list.

## Related Files
- `src/app/layout.tsx`
- `src/app/_components/RootView.tsx`
- `src/components/layout/AppShell/AppShell.tsx`
- `src/components/layout/SheetManager/SheetManager.tsx`
- `src/hooks/useNavigation.ts`
- `src/lib/navigation/types.ts`
- `src/lib/navigation/reducer.ts`
- `src/app/thoughts/page.tsx`
- `next.config.ts`
