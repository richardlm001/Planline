# T-011 — Drag to Move Tasks

**Status:** Backlog
**Size:** M

## Goal

Allow users to horizontally drag a task bar on the timeline to change its `startDayIndex`. Downstream dependents auto-shift via the scheduling engine.

## Non-Goals

- Vertical drag to re-order (future).
- Resize (T-012).
- Snapping to dependency constraints during drag (engine enforces after drop).

## UX Notes

- Cursor changes to `grab` on hover, `grabbing` while dragging.
- Bar snaps to day columns (discrete positions).
- While dragging, the bar follows the mouse and shows a ghost/preview position.
- On drop, the store is updated and the scheduler re-runs, which may shift downstream tasks.
- If a task has upstream dependencies, it can still be manually dragged later (the engine will clamp it forward if needed).

## Data Model Impact

None. Updates `startDayIndex` on the task.

## Implementation Steps

1. Add pointer event handlers to `TaskBar.tsx`:
   - `onPointerDown` → start tracking.
   - `onPointerMove` → compute new `startDayIndex` from delta pixels / columnWidth.
   - `onPointerUp` → commit the change via `store.updateTask(id, { startDayIndex })`.
2. Use `setPointerCapture` for reliable tracking.
3. During drag, update bar position visually (local state, not store) for responsiveness.
4. On drop, update store → scheduler runs → `computedStarts` update → bars re-render at final positions.
5. Ensure the drag does not interfere with text selection or other interactions.

## Tests Required

- Dragging a bar by N columns changes `startDayIndex` by N.
- After dropping, downstream dependents reflect updated positions.

## Definition of Done

- Task bars can be dragged horizontally to change their start day.
- Snap to day grid works.
- Downstream tasks auto-shift.
