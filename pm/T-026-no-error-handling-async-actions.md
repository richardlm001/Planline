# T-026: No Error Handling on Store Async Actions

**Priority:** High  
**Category:** Bug / Resilience

## Problem

All store actions (`addTask`, `updateTask`, `removeTask`, `addDependency`, etc.) follow a pattern of:
1. Update state optimistically
2. Persist to IndexedDB with `await repo.xxx()`

There is no error handling around the persistence calls. If IndexedDB write fails (storage full, browser quota exceeded, corrupted database), the user sees the UI update but the data is lost on reload.

Additionally, `hydrate()` has no error handling — if the database is corrupted or unreadable, the app shows "Loading…" forever with no error feedback.

## Location

- [src/store/useProjectStore.ts](../src/store/useProjectStore.ts) — all async actions

## Impact

- **Silent data loss**: UI shows success but data isn't persisted
- **Infinite loading**: If `hydrate()` fails, user is stuck on loading screen
- **No recovery path**: User has no way to know something went wrong

## Expected Behavior

- Wrap persistence calls in try/catch
- On failure, either revert the optimistic update or show an error toast
- `hydrate()` should catch errors and show an error state in the UI
- Consider a global error boundary for IndexedDB failures

## Acceptance Criteria

- [ ] All persistence calls wrapped in try/catch
- [ ] Failed persistence triggers user-visible feedback
- [ ] `hydrate()` error shows error state instead of infinite loading
- [ ] Unit tests for persistence failure scenarios
