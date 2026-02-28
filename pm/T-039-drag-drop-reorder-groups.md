# T-039 — Drag-and-Drop Reorder & Group Assignment

**Status:** Backlog
**Size:** L
**Depends on:** T-038

## Goal

Allow users to drag one or more selected tasks to reorder them in the sidebar list, move them into a group, move them out of a group, or transfer them between groups. Support both sidebar and timeline vertical drag.

## Non-Goals

- Horizontal drag to change start date (already implemented in T-011).
- Drag groups to reorder groups (future).
- Drag to merge groups (future).

## UX Notes

### Sidebar drag
- A drag handle (grip icon) appears on each sidebar task row.
- Dragging a single task reorders it in the list. A drop indicator line shows the insertion point.
- If multiple tasks are selected (T-038), dragging any one of them moves the entire selection.
- Dropping on top of a group header assigns the task(s) to that group (sets `groupId`).
- Dropping between items at the root level removes `groupId` (un-groups).
- Dropping between items inside a different group moves task(s) to that group.
- `sortOrder` values are recalculated on drop to reflect the new ordering.

### Timeline vertical drag
- Dragging a task bar vertically (not horizontally) on the timeline reorders it to the row it's dropped on.
- If the target row belongs to a different group (or no group), the task's `groupId` is updated accordingly.
- Visual feedback: a horizontal guide line or row highlight shows the target drop position.

### Shared behavior
- During drag, a ghost/preview indicates where the item(s) will land.
- Dropping in an invalid area (e.g., outside the list) cancels the operation.
- After drop, `sortOrder` is renormalized to prevent fragmentation (see T-027 pattern).

## Data Model Impact

Updates `sortOrder` and `groupId` on affected tasks. No schema changes.

## Implementation Steps

1. **Sidebar drag-and-drop:**
   a. Add a drag handle to `SidebarTaskRow`.
   b. Implement drag start: capture dragged task IDs (single or multi-selected).
   c. Implement drag over: calculate insertion index, show drop indicator.
   d. Implement drop: update `groupId` and `sortOrder` for moved tasks via store action.
   e. Add a store action `moveTasksToPosition(taskIds: string[], targetIndex: number, targetGroupId?: string)`.
2. **Timeline vertical drag:**
   a. Detect vertical drag (vs. horizontal) on `TaskBar` — if deltaY > deltaX threshold, enter vertical drag mode.
   b. Track the target row index as the user drags vertically.
   c. Show a horizontal guide line at the target row.
   d. On drop, call `moveTasksToPosition` with the computed target position and group.
3. **SortOrder renormalization:**
   a. After moving tasks, renormalize `sortOrder` across all tasks to prevent gaps/fragmentation.
   b. Persist updated sort orders to IndexedDB.
4. **Multi-task drag:**
   a. When dragging with multiple tasks selected, move all selected tasks together.
   b. Preserve relative order of selected tasks within the moved set.

## Tests Required

- Dragging a task from root into a group sets its `groupId`.
- Dragging a task out of a group clears its `groupId`.
- Dragging a task between two other tasks updates `sortOrder` correctly.
- Dragging multiple selected tasks preserves their relative order.
- Vertical drag on timeline changes task row position and group assignment.
- SortOrder values are renormalized after drag operations.
- Canceling a drag (drop outside valid area) makes no changes.

## Definition of Done

- Tasks can be reordered by dragging in the sidebar.
- Tasks can be moved into/out of/between groups via drag in the sidebar.
- Tasks can be vertically dragged on the timeline to reorder and reassign groups.
- Multi-selected tasks move together.
- Sort order is consistent after every operation.
