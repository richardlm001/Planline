# T-009 — Sidebar Task List & Inline Rename

**Status:** Backlog
**Size:** M

## Goal

Populate the left sidebar with a list of task names (in `sortOrder`). Clicking a task name selects it. Double-clicking (or pressing F2) enters inline edit mode to rename the task.

## Non-Goals

- Task groups and indentation (T-017).
- Drag to re-order tasks (future).
- Delete (T-016 — keyboard).

## UX Notes

- Each row is ~40px tall, matching the timeline row height for alignment.
- Selected task row has a subtle highlight.
- Inline edit: the text becomes an input field; pressing Enter or blurring saves; Escape cancels.
- Task names default to "New task" (set in T-010).

## Data Model Impact

Uses `selectedTaskId` state in the store (new field to add).

## Implementation Steps

1. Add `selectedTaskId: string | null` + `selectTask(id)` to the Zustand store.
2. Create `src/ui/components/SidebarTaskRow.tsx`:
   - Displays task name.
   - Click to select. Double-click or F2 to enter edit mode.
   - In edit mode: renders `<input>`, saves on Enter/blur, cancels on Escape.
   - Calls `store.updateTask(id, { name })` on save.
3. Update `Sidebar.tsx` to render a list of `SidebarTaskRow` components.
4. Ensure row heights match timeline row heights so horizontal alignment is maintained.

## Tests Required

- Renders task names from store.
- Clicking a row sets `selectedTaskId`.
- Editing and pressing Enter updates the task name.

## Definition of Done

- Sidebar shows all tasks by name.
- Tasks can be selected and renamed inline.
- Sidebar rows align vertically with timeline bars.
