# T-010 — Add Task (Button + ENTER)

**Status:** Backlog
**Size:** S

## Goal

Allow users to create a new task via an "Add task" button in the sidebar or by pressing ENTER. The new task appears as a 3-day bar starting at today.

## Non-Goals

- TAB to create dependent task (T-016).
- Task group assignment.

## UX Notes

- "+" button at the bottom of the sidebar task list (or top, minimal style).
- Pressing ENTER when no task is in edit mode also creates a task.
- New task is created with name "New task", duration 3 days, start at today.
- After creation, the new task's name is immediately in edit mode for renaming.
- Auto-assigned color from palette (next color in rotation).

## Data Model Impact

Uses existing `Task` type. Auto-increments `sortOrder`.

## Implementation Steps

1. Add `addTask()` action to the store (if not already complete from T-005):
   - Generates `id` via nanoid.
   - Sets `startDayIndex` to today's day index.
   - Sets `durationDays` to 3.
   - Sets name to "New task".
   - Picks next color from palette.
   - Sets `sortOrder` to `max(existing) + 1`.
   - Persists to DB.
   - Re-runs scheduler.
2. Create "Add task" button in `Sidebar.tsx`.
3. Add global keydown listener for ENTER → create task (unless an input is focused).
4. After creation, select the new task and enter name-edit mode.

## Tests Required

- Clicking "Add task" adds a task to the store with correct defaults.
- New task appears in the sidebar and on the timeline.

## Definition of Done

- Users can create tasks via button or ENTER key.
- New task bar appears on the timeline at today with 3-day duration.
- Task name is immediately editable after creation.
