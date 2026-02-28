# T-030: TaskBar Drag Uses computedStart but Persists Offset to startDayIndex

**Priority:** Medium  
**Category:** Bug

## Problem

In `TaskBar.tsx`, when a task is dragged and dropped, the new start position is calculated as:

```ts
const newStart = task.startDayIndex + daysDelta;
```

However, the visual drag uses `computedStart` (the scheduled position after dependency propagation). If a task has predecessors pushing it forward, `computedStart > task.startDayIndex`. The user sees the task at `computedStart`, drags it by `daysDelta`, but the persisted change is applied to `startDayIndex`.

**Scenario:**
1. Task A ends at day 10
2. Task B has `startDayIndex = 5`, but `computedStart = 10` (pushed by A)
3. User drags Task B visually from day 10 to day 15 (delta = 5 days)
4. Persisted: `startDayIndex = 5 + 5 = 10`
5. After re-scheduling, `computedStart` may still be 10 (unchanged) because the predecessor still pushes it

This creates a confusing experience where dragging a dependency-constrained task may appear to have no effect.

## Location

- [src/ui/components/TaskBar.tsx](../src/ui/components/TaskBar.tsx) — `handlePointerUp` (line ~91)

## Expected Behavior

Either:
1. Prevent dragging tasks that are constrained by predecessors (show a visual indicator)
2. Or apply the delta relative to `computedStart` and set `startDayIndex` accordingly: `startDayIndex = computedStart + daysDelta`

## Acceptance Criteria

- [ ] Dragging a dependency-constrained task produces predictable results
- [ ] User gets feedback when a drag has no effect due to constraints
- [ ] Visual position matches persisted position after drop
