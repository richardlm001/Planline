# T-016 — Keyboard Navigation & Delete

**Status:** Backlog
**Size:** M

## Goal

Implement keyboard shortcuts for efficient task management: arrow keys to navigate, DELETE to remove, ENTER to add, TAB to create a dependent task.

## Non-Goals

- Undo/redo.
- Multi-select.

## UX Notes

- **↑ / ↓**: move selection between tasks in the sidebar.
- **DELETE / Backspace**: delete the selected task (and all its dependencies). No confirmation dialog in MVP.
- **ENTER**: create a new task (same as the add-task button). If a task is selected, the new task is inserted after it in sort order.
- **TAB**: create a new task that is a dependent of the selected task (auto-creates a Finish-to-Start dependency). New task starts at the end of the selected task.
- **Escape**: deselect current task / cancel inline edit.
- **F2**: enter rename mode for the selected task.
- Shortcuts should not fire when an input/textarea is focused (except Escape and Enter in edit mode).

## Data Model Impact

None.

## Implementation Steps

1. Create `src/ui/hooks/useKeyboardShortcuts.ts`:
   - Attach a `keydown` listener to `document`.
   - Check `event.target` to avoid firing during input focus.
   - Dispatch store actions based on key.
2. Implement each shortcut:
   - Arrow keys: compute next/prev task by `sortOrder`, call `selectTask`.
   - DELETE: call `removeTask(selectedTaskId)`.
   - ENTER: call `addTask()` with appropriate `sortOrder`.
   - TAB: call `addTask()` + `addDependency(selectedTaskId, newTaskId)`.
   - Escape: call `selectTask(null)`.
   - F2: set a `renamingTaskId` flag.
3. Wire the hook into `App.tsx`.
4. Handle dependency deletion: when a task is selected, pressing DELETE removes the task. To delete a dependency, the user selects a task and the dependency is removed when the task is removed. (Individual dependency deletion can be a follow-up.)

## Tests Required

- Pressing ↓ with task A selected selects task B.
- DELETE removes the selected task from the store.
- TAB creates a new task with a dependency on the selected task.
- Shortcuts don't fire during inline edit (except Escape/Enter).

## Definition of Done

- All listed keyboard shortcuts work.
- Navigation feels snappy.
- No interference with text editing.
