# T-004 — Scheduling Engine — Cycle Detection

**Status:** Backlog
**Size:** S

## Goal

Extend the scheduling engine to detect dependency cycles and return a clear error state instead of crashing or looping infinitely.

## Non-Goals

- UI error display (handled in store / UI tickets).
- Automatic cycle resolution.

## UX Notes

When a cycle is detected, the scheduling function should return which task IDs are involved so the UI can highlight them later.

## Data Model Impact

Extend `ScheduleResult`:

```ts
type ScheduleResult =
  | { ok: true; starts: Map<string, number> }
  | { ok: false; error: 'cycle'; taskIds: string[] };
```

## Implementation Steps

1. Update `src/domain/scheduler.ts`:
   - During topological sort, detect cycles (e.g., via Kahn's algorithm tracking remaining in-degrees).
   - If any nodes remain after BFS, they form a cycle.
   - Collect those task IDs and return the error variant.
2. Update the `propagate()` return type to the discriminated union above.
3. Update existing tests from T-003 to use `result.ok === true` checks.

## Tests Required

Add to `src/domain/__tests__/scheduler.test.ts`:

1. **Simple cycle A → B → A** — returns `{ ok: false, error: 'cycle', taskIds: [A, B] }`.
2. **Cycle in subset** — A → B → C → B (C → B creates cycle). Non-cyclic tasks still identified.
3. **No cycle** — existing tests still return `{ ok: true, ... }`.

## Definition of Done

- `propagate()` never throws on cyclic input.
- Returns discriminated union with cycle info.
- All existing + new tests pass.
