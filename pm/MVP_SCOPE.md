# Planline — MVP Scope

## Vision

A dead-simple, single-project **timeline-only** planning tool. Think "Gantt chart, but calm."
Fully offline-first, forkable, runs locally with `npm run dev`.

## In Scope (MVP)

### Core Model
- Single project (one timeline, one dataset).
- A **task** is defined by `(id, name, startDayIndex, durationDays, groupId?, color?)`.
  - `endDayIndex` is derived: `startDayIndex + durationDays - 1`.
  - `startDayIndex` is an integer offset from a project epoch (e.g., 2024-01-01).
- A **dependency** is `(fromTaskId, toTaskId)` — Finish-to-Start only.
- A **group** is visual-only: `(id, name, collapsed?)`. No scheduling implications.

### Scheduling Engine (pure functions)
- Given tasks + dependencies → compute effective start positions after propagation.
- Finish-to-Start: successor cannot start before predecessor ends.
- Multiple predecessors: start after `max(end(predecessors))`.
- Cycle detection → error state, never crash.
- Deterministic results.

### UI / Interaction
- **Layout**: left sidebar (task list) + right scrollable timeline grid.
- **Task creation**: "Add task" button (or ENTER key) creates a 3-day bar at today.
- **Task naming**: inline click-to-edit in the left sidebar.
- **Move task**: horizontal drag on the bar.
- **Resize task**: drag left/right edge of the bar.
- **Create dependency**: drag from end-connector of one bar to start-connector of another.
- **Dependency arrows**: thin arrows rendered on the timeline (always visible).
- **Delete task / dependency**: select + DELETE key.
- **Keyboard navigation**: arrow keys to traverse tasks, ENTER to create, TAB to create dependent task, DELETE to remove.
- **Zoom**: three discrete modes — Day, Week, Month.
- **Today line**: thin red vertical line.
- **Weekend shading**: weekends visually distinguished (shaded columns), but all days count equally for duration.
- **Bar colors**: auto-assigned from a curated palette; user can change from a predefined list.
- **Task groups**: visual-only collapsible groups with indentation in the sidebar.
- **Project name**: inline-editable at the top; defaults to "Project 01".
- **Viewport**: center on today when app loads.
- **"Saved on device" indicator**: subtle text confirming IndexedDB persistence.
- **Export JSON / Import JSON**: buttons to download project data and re-import.

### Persistence
- IndexedDB via Dexie.js.
- Auto-save on every mutation.
- Offline-first — no network calls.

### Tech Stack
- Vite + React 18+ + TypeScript (strict)
- Tailwind CSS v4
- Zustand (state management)
- Dexie (IndexedDB wrapper)
- date-fns (date utilities)
- Vitest (unit tests)

## Non-Goals (MVP)

- Multiple projects / workspaces.
- Manual date entry fields (all dates via drag/drop).
- Task status / progress percentage.
- Assignees / owners / avatars.
- Kanban board or list view.
- Time tracking / timesheets.
- Notifications / reminders.
- Real-time collaboration / multi-user.
- Backend / server / API.
- Authentication.
- Mobile-optimized UI (desktop-first).
- Undo/redo (future ticket).
- Drag to re-order tasks in sidebar (future).
- Dependency types other than Finish-to-Start (future).
- Critical path highlighting (future).
- Milestones (future).

## Interaction Rules

1. **No manual date fields.** Dates are always set via drag or resize on the timeline.
2. **Dependencies auto-shift.** When a task moves or resizes, all downstream dependents are recomputed immediately.
3. **Tasks cannot be dragged earlier than their dependency constraint.** The engine enforces this.
4. **Adding a dependency that creates a cycle shows an error and is rejected.**
5. **Zoom changes column width, not data.** Task positions stay consistent.
6. **All mutations auto-save to IndexedDB.**
