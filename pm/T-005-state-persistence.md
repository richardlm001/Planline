# T-005 — Zustand Store & Dexie Persistence

**Status:** Backlog
**Size:** M

## Goal

Create a Zustand store that holds all application state (tasks, dependencies, groups, project metadata) and auto-saves every mutation to IndexedDB via Dexie. On app load, hydrate from IndexedDB.

## Non-Goals

- UI components (later tickets).
- Undo/redo.

## UX Notes

- A subtle "Saved on device" indicator should be possible to derive from store state (e.g., `lastSavedAt` timestamp). The indicator itself is built in a UI ticket.

## Data Model Impact

No schema changes. Uses types from T-002.

## Implementation Steps

1. Create `src/db/repository.ts` with CRUD functions:
   - `loadAll(): Promise<{ tasks, dependencies, groups, project }>`
   - `saveTask(task)`, `deleteTask(id)`, `saveDependency(dep)`, `deleteDependency(id)`
   - `saveGroup(group)`, `deleteGroup(id)`
   - `saveProject(project)`
2. Create `src/store/useProjectStore.ts` (Zustand):
   - State: `tasks: Task[]`, `dependencies: Dependency[]`, `groups: Group[]`, `project: Project`, `computedStarts: Map<string, number>`, `scheduleError: string | null`, `lastSavedAt: Date | null`, `isLoaded: boolean`.
   - Actions:
     - `hydrate()` — load from DB, run scheduler, set state.
     - `addTask(task)` — add to array, save to DB, re-run scheduler.
     - `updateTask(id, partial)` — update in array, save to DB, re-run scheduler.
     - `removeTask(id)` — remove from array + associated deps, delete from DB, re-run scheduler.
     - `addDependency(from, to)` — run scheduler to check for cycles first; if ok, persist.
     - `removeDependency(id)` — remove, re-run scheduler.
     - `updateProject(partial)` — update project metadata, save.
     - CRUD for groups.
   - Every mutation that changes tasks/deps should re-run `propagate()` and update `computedStarts`.
3. Wrap DB writes in a helper that sets `lastSavedAt`.

## Tests Required

- Unit test: adding a task updates `computedStarts`.
- Unit test: adding a cyclic dependency sets `scheduleError`.
- Integration test (with fake-indexeddb): hydrate loads persisted data.

## Definition of Done

- Store actions work and re-run scheduling.
- Data round-trips through IndexedDB (write → refresh → read).
- Tests pass.
