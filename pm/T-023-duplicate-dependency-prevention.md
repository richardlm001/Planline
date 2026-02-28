# T-023: Duplicate Dependency Prevention Missing

**Priority:** High  
**Category:** Bug

## Problem

The `addDependency` action in the store only checks for cycles but does not check whether an identical dependency (same `fromTaskId` → `toTaskId`) already exists. Users can create duplicate dependency arrows between the same two tasks by:

1. Using the connector drag interaction multiple times
2. Using the Tab shortcut multiple times on the same task

Each duplicate creates a new record in IndexedDB and renders a duplicate arrow on the timeline.

## Location

- [src/store/useProjectStore.ts](../src/store/useProjectStore.ts) — `addDependency` action (line ~156)

## Expected Behavior

If a dependency from task A to task B already exists, `addDependency` should return `{ ok: false, error: 'Dependency already exists' }` without creating a duplicate.

## Fix

Add a duplicate check before the cycle check:

```ts
addDependency: async (fromTaskId: string, toTaskId: string) => {
  const state = get();
  
  // Prevent self-dependency
  if (fromTaskId === toTaskId) {
    return { ok: false, error: 'Cannot create self-dependency' };
  }
  
  // Prevent duplicate
  const exists = state.dependencies.some(
    (d) => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
  );
  if (exists) {
    return { ok: false, error: 'Dependency already exists' };
  }
  
  // ... rest of cycle check and persistence
};
```

## Acceptance Criteria

- [ ] Duplicate dependencies are rejected
- [ ] Self-dependencies (A → A) are rejected
- [ ] Appropriate error message returned
- [ ] Unit tests for duplicate and self-dependency scenarios
