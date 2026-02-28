# T-038 — Multi-Select Tasks

**Status:** Backlog
**Size:** M

## Goal

Allow users to select multiple tasks at once using Shift+click (contiguous range) and Cmd/Ctrl+click (toggle individual). This is a foundation for bulk operations like drag-to-reorder and drag-between-groups.

## Non-Goals

- Drag-and-drop of selected tasks (T-039).
- "Select all" shortcut (future).

## UX Notes

- **Click** a task (sidebar row or timeline bar): selects that task only, deselecting all others (current behavior preserved).
- **Cmd/Ctrl+Click**: toggles the clicked task in/out of the selection without affecting other selected tasks.
- **Shift+Click**: selects a contiguous range from the last-clicked task (anchor) to the clicked task, based on the current sorted sidebar order. Replaces any prior selection.
- Selected tasks are visually highlighted in both the sidebar and the timeline (e.g., subtle background tint on sidebar rows, brighter outline on task bars).
- Clicking an empty area or pressing **Escape** clears the selection.

## Data Model Impact

Store changes:
- Replace `selectedTaskId: string | null` with `selectedTaskIds: string[]`.
- Add `selectionAnchorId: string | null` to track the anchor for Shift+click range selection.
- Update `selectTask` action to accept a modifier context: `selectTask(id: string, opts?: { shift?: boolean; meta?: boolean })`.

## Implementation Steps

1. Update the store type: replace `selectedTaskId` with `selectedTaskIds: string[]` and add `selectionAnchorId: string | null`.
2. Rewrite `selectTask(id, opts?)`:
   - Plain click: set `selectedTaskIds` to `[id]`, set `selectionAnchorId` to `id`.
   - Cmd/Ctrl+click: toggle `id` in `selectedTaskIds`; update anchor to `id`.
   - Shift+click: compute range from `selectionAnchorId` to `id` using sorted task list; set `selectedTaskIds` to that range.
   - `selectTask(null)`: clear selection.
3. Add a `clearSelection` convenience action.
4. Update all components reading `selectedTaskId` → `selectedTaskIds`:
   - `SidebarTaskRow` — highlight if task is in selection.
   - `SidebarGroupRow` — pass modifier keys on click.
   - `TaskBar` — highlight if selected, pass modifier keys on click.
   - `useKeyboardShortcuts` — delete all selected tasks on Delete/Backspace.
   - Any other consumer.
5. Pass `event.shiftKey` and `event.metaKey || event.ctrlKey` from click handlers to `selectTask`.
6. Ensure Escape key and click-on-empty-area clear the selection.

## Tests Required

- Plain click selects one task, deselects others.
- Cmd/Ctrl+click toggles a task without affecting others.
- Shift+click selects a contiguous range.
- Shift+click with no anchor falls back to selecting one task.
- Escape clears selection.
- Delete key removes all selected tasks.

## Definition of Done

- Users can multi-select tasks via Shift+click and Cmd/Ctrl+click.
- Selection state is reflected visually in sidebar rows and task bars.
- Keyboard delete operates on all selected tasks.
- Existing single-click selection behavior is preserved.
