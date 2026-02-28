# T-012 — Resize Task Bars

**Status:** Backlog
**Size:** M

## Goal

Allow users to drag the left or right edge of a task bar to change its `startDayIndex` (left edge) or `durationDays` (right edge). Downstream dependents auto-shift.

## Non-Goals

- Move (T-011).
- Minimum duration enforcement beyond 1 day.

## UX Notes

- Resize handles: ~6px invisible hover zones on left and right edges of the bar.
- Cursor changes to `col-resize` when hovering over a handle.
- Dragging the **right edge** changes `durationDays`. Minimum 1 day.
- Dragging the **left edge** changes `startDayIndex` and adjusts `durationDays` so the right edge stays put. Minimum 1 day duration.
- Snap to day columns.

## Data Model Impact

None. Updates `startDayIndex` and/or `durationDays`.

## Implementation Steps

1. Add left and right resize handle elements inside `TaskBar.tsx`.
2. On pointer down on a handle, determine which edge is being dragged.
3. On pointer move:
   - **Right edge**: `newDuration = max(1, originalDuration + deltaDays)`.
   - **Left edge**: `newStart = originalStart + deltaDays`, `newDuration = max(1, originalDuration - deltaDays)`.
4. Update local state during drag for responsiveness.
5. On pointer up, commit to store.
6. Prevent move-drag from triggering when on a resize handle (use `stopPropagation`).

## Tests Required

- Resizing right edge increases/decreases duration.
- Resizing left edge moves start and adjusts duration.
- Duration cannot go below 1.
- Downstream tasks shift when duration increases.

## Definition of Done

- Both edges of a task bar are resizable.
- Duration snaps to day increments.
- Downstream dependents auto-shift when duration changes.
