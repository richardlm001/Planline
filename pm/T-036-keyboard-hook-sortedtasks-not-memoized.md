# T-036: Keyboard Shortcut Hook Rebuilds sortedTasks Every Render

**Priority:** Medium  
**Category:** Performance

## Problem

The `useKeyboardShortcuts` hook subscribes to the full `tasks` array and sorts it inside the hook body without memoization:

```ts
const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
```

This creates a new sorted array on every render. Since `handleKeyDown` is a `useCallback` that depends on `sortedTasks`, and `sortedTasks` is a new reference every time, `handleKeyDown` is also recreated every render. This triggers:
1. `window.removeEventListener('keydown', handleKeyDown)` 
2. `window.addEventListener('keydown', handleKeyDown)`

on every single render.

## Location

- [src/ui/hooks/useKeyboardShortcuts.ts](../src/ui/hooks/useKeyboardShortcuts.ts) — line 14

## Fix

Wrap in `useMemo`:

```ts
const sortedTasks = useMemo(
  () => [...tasks].sort((a, b) => a.sortOrder - b.sortOrder),
  [tasks]
);
```

## Acceptance Criteria

- [ ] `sortedTasks` is memoized with `useMemo`
- [ ] Event listener not re-attached unnecessarily
