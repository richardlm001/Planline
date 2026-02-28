# T-003 — Scheduling Engine — Propagation

**Status:** Backlog
**Size:** M

## Goal

Implement the core scheduling function: given a list of tasks and dependencies, compute the effective `startDayIndex` for each task after Finish-to-Start propagation. This must be a **pure function** with no side effects.

## Non-Goals

- Cycle detection (T-004).
- UI integration.
- Persistence.

## UX Notes

N/A — pure domain logic.

## Data Model Impact

No schema changes. Operates on `Task[]` and `Dependency[]` from T-002.

Produces a `Map<string, number>` mapping `taskId → computedStartDayIndex`.

## Implementation Steps

1. Create `src/domain/scheduler.ts`.
2. Implement `propagate(tasks: Task[], dependencies: Dependency[]): ScheduleResult`.
   - `ScheduleResult = { starts: Map<string, number> }` (for now; T-004 will add error states).
3. Algorithm:
   - Build adjacency list: for each dependency, `predecessors[toTaskId].push(fromTaskId)`.
   - Topological sort all tasks.
   - Walk in topological order. For each task:
     - If it has predecessors, its effective start = `max(predecessor.start + predecessor.duration)` across all predecessors.
     - If that effective start > task's own `startDayIndex`, use the effective start.
     - Otherwise, keep the task's own `startDayIndex` (user-placed position).
   - Return the map of computed starts.
4. Export helper: `getTaskEnd(start: number, duration: number): number` → `start + duration` (the day-index of the first day **after** the task).

## Tests Required

All in `src/domain/__tests__/scheduler.test.ts`:

1. **No dependencies** — tasks keep their original starts.
2. **Simple chain A → B → C** — B starts at end(A), C starts at end(B).
3. **Resize A shifts B and C** — increase A's duration, verify B and C move.
4. **Move A shifts downstream** — increase A's start, verify B and C shift.
5. **Multiple predecessors** — task D depends on both A and X. D starts at `max(end(A), end(X))`.
6. **No dependencies on a task** — unconnected task stays put.
7. **Predecessor finishes before successor's placed start** — successor keeps its own later start.

## Definition of Done

- `propagate()` function exported from `src/domain/scheduler.ts`.
- All 7 tests pass.
- Function is pure (no imports from React, Zustand, or Dexie).
