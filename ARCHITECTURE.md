# ARCHITECTURE.md — Planline System Architecture

## 1. System Overview

Planline is a **single-page, offline-first** Gantt timeline application. It runs entirely in the browser with zero server dependencies. Users create tasks, arrange them on a timeline via drag-and-drop, define finish-to-start dependencies between tasks, and organize tasks into visual groups.

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │  React   │──▶│ Zustand  │──▶│  Dexie   │──▶ IndexedDB│
│  │   UI     │◀──│  Store   │   │   DB     │            │
│  └──────────┘   └────┬─────┘   └──────────┘            │
│                      │                                  │
│                 ┌────▼─────┐                            │
│                 │ Scheduler│  (pure functions)           │
│                 │ (domain) │                             │
│                 └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

## 2. Layer Architecture

The codebase follows a strict **three-layer architecture** with unidirectional data flow.

### Layer 1: Domain (`src/domain/`)

**Purpose:** Pure business logic with zero external dependencies (no React, no IO).

| File | Responsibility |
|------|---------------|
| `types.ts` | Core data interfaces: `Task`, `Dependency`, `Group`, `Project` |
| `scheduler.ts` | Dependency propagation engine — Kahn's topological sort + cycle detection |
| `constants.ts` | Project epoch, day-index ↔ date conversions, color palette, default values |

**Key design decisions:**

- **Day-index model:** All dates are represented as integer offsets from a fixed epoch (`2024-01-01`). This simplifies arithmetic and avoids timezone issues. `dayIndexToDate()` / `dateToDayIndex()` convert when UI display is needed.
- **`endDayIndex` is derived:** A task's end is always `startDayIndex + durationDays`. Only `startDayIndex` and `durationDays` are stored.
- **Scheduler is stateless:** `propagate(tasks, dependencies)` takes data in, returns either `{ ok: true, starts: Map }` or `{ ok: false, error: 'cycle', taskIds: [...] }`. It never mutates input.

### Layer 2: Persistence (`src/db/`)

**Purpose:** IndexedDB read/write via Dexie.js. Acts as a durable cache — the store is the source of truth at runtime.

| File | Responsibility |
|------|---------------|
| `db.ts` | Dexie schema definition — 4 tables: `tasks`, `dependencies`, `groups`, `project` |
| `repository.ts` | CRUD functions: `loadAll()`, `saveTask()`, `deleteTask()`, `saveDependency()`, etc. |
| `export.ts` | JSON export/import: `buildExportData()`, `validateImportData()`, `importProject()` |

**Key design decisions:**

- **Repository pattern:** No component or store action directly accesses `db.ts`. All DB operations go through `repository.ts`.
- **Optimistic writes:** The store updates state immediately, then persists asynchronously. The UI never waits for IndexedDB.
- **Atomic import:** `importProject()` wraps all table clears + bulk inserts in a single Dexie transaction.
- **Schema version 1:** Single version, no migrations yet. Tables use `id` as primary key with secondary indices on `groupId`, `sortOrder`, `fromTaskId`, `toTaskId`.

### Layer 3: UI (`src/ui/`)

**Purpose:** React components, hooks, and UI constants. Reads from and dispatches actions to the Zustand store.

```
src/ui/
  App.tsx              Root layout — sidebar + timeline split pane
  constants.ts         ZoomLevel type, zoom configs, layout dimensions
  components/          All visual components
  hooks/               Custom hooks (useKeyboardShortcuts)
```

## 3. State Management

### Single Zustand Store (`src/store/useProjectStore.ts`)

All application state lives in one flat Zustand store. No middleware, no devtools, no persistence middleware (persistence is manual via repository calls).

```
ProjectState
├── Data ─────────── tasks[], dependencies[], groups[], project
├── Computed ─────── computedStarts (Map), scheduleError, cycleTaskIds
├── UI State ─────── selectedTaskId, editingTaskId, linkingFromTaskId, zoomLevel, lastSavedAt, isLoaded
└── Actions ──────── hydrate, addTask, updateTask, removeTask, addDependency, removeDependency,
                     updateProject, addGroup, updateGroup, removeGroup, selectTask, ...
```

**Data flow for mutations:**

```
User Action → Store Action → Update State + Run Scheduler → Re-render
                           → Async Persist to IndexedDB
```

1. A component calls a store action (e.g., `addTask()`).
2. The action computes the new state, runs `propagate()` to get updated `computedStarts`.
3. `set()` updates the store atomically — React re-renders affected subscribers.
4. The action then `await`s the corresponding `repo.*` call to persist.

**Scheduler integration:** The `runScheduler()` helper wraps `propagate()` and is called inside every action that modifies tasks or dependencies. Non-scheduling updates (e.g., renaming a task, changing color) skip the scheduler for performance.

### Hydration

On mount, `App.tsx` calls `hydrate()` once. This loads all data from IndexedDB, runs the scheduler, and sets `isLoaded: true`. The app shows a loading screen until hydration completes.

## 4. Scheduling Engine

The scheduler implements **Finish-to-Start dependency propagation** using Kahn's algorithm for topological sorting.

### Algorithm

```
1. Build adjacency lists (predecessors, successors) and in-degree map
2. Topological sort via Kahn's algorithm:
   - Seed queue with tasks having in-degree 0
   - Process queue: for each task, decrement successors' in-degree
   - If successor reaches in-degree 0, enqueue it
3. Cycle detection: if sorted.length < tasks.length → cycle exists
4. Walk sorted order: effectiveStart = max(task.startDayIndex, max(predEnd for each predecessor))
```

### Cycle handling

- Cycles are detected before persistence. `addDependency()` runs the scheduler on the speculative new dependency set — if a cycle is found, the dependency is rejected and never saved.
- The `ScheduleResult` discriminated union clearly separates success (`ok: true, starts`) from failure (`ok: false, error: 'cycle', taskIds`).

## 5. Component Architecture

### Layout Structure

```
App (flex h-screen)
├── Sidebar (fixed 260px, left)
│   ├── ProjectHeader (editable project name)
│   ├── ExportImportButtons
│   ├── Ungrouped SidebarTaskRow[]
│   ├── For each Group:
│   │   ├── SidebarGroupRow (collapsible header)
│   │   └── SidebarTaskRow[] (hidden when collapsed)
│   └── SavedIndicator
│
└── Timeline (flex-1, right, overflow scroll)
    ├── ZoomToggle (day / week / month)
    ├── TimelineHeader (sticky date labels)
    ├── TimelineBody
    │   ├── DependencyArrows (SVG overlay)
    │   └── TaskBar[] (absolutely positioned)
    └── TodayLine (vertical red line)
```

### Key Components

**TaskBar** — The most complex component. Handles:
- Horizontal drag-to-move (pointer capture, pixel → day-index snapping)
- Left/right edge resize (modifies `startDayIndex` and/or `durationDays`)
- Dependency connector drag (in-connector / out-connector circles)
- Wrapped in `React.memo()` for render performance

**Timeline** — Generates the column grid based on zoom level. Computes `dayToPixel()` mapping. Auto-scrolls to center on today on initial load. Contains the `useTodayIndex` local hook for midnight refresh.

**DependencyArrows** — SVG overlay rendering L-shaped paths between task bars. Uses `useId()` for unique SVG marker IDs. Filters out arrows for tasks inside collapsed groups.

**Sidebar** — Memoized sort/filter logic groups tasks by `groupId`, sorts by `sortOrder`, and handles the ungrouped-then-grouped rendering order.

## 6. Zoom System

Three discrete zoom levels, each defining column width and days-per-column:

| Level | Column Width | Days/Column | Use Case |
|-------|-------------|-------------|----------|
| Day   | 40px        | 1           | Detailed daily view |
| Week  | 40px        | 7           | Weekly overview |
| Month | 60px        | 30          | High-level planning |

The zoom level is stored in the Zustand store. Changing zoom re-renders the timeline grid and repositions all task bars. Task data is zoom-independent.

## 7. Data Model

### Entity Relationship

```
Project (1)
  │
  ├── Task (many)
  │     ├── id: string (nanoid)
  │     ├── name: string
  │     ├── startDayIndex: number (offset from epoch)
  │     ├── durationDays: number (≥ 1)
  │     ├── groupId?: string (optional FK → Group.id)
  │     ├── color: string (hex)
  │     └── sortOrder: number
  │
  ├── Dependency (many)
  │     ├── id: string (nanoid)
  │     ├── fromTaskId: string (FK → Task.id)
  │     └── toTaskId: string (FK → Task.id)
  │
  └── Group (many)
        ├── id: string (nanoid)
        ├── name: string
        ├── collapsed: boolean
        └── sortOrder: number
```

- **Finish-to-Start only:** `fromTaskId` must finish before `toTaskId` can start.
- **Groups are visual-only:** They affect sidebar display and collapsed-state filtering but have no scheduling implications.
- **Sort order:** Explicit integer field on tasks and groups. Managed when inserting (midpoint strategy for between-task insertion).

### IndexedDB Schema (Dexie)

```
Version 1:
  tasks:        id, groupId, sortOrder
  dependencies: id, fromTaskId, toTaskId
  groups:       id, sortOrder
  project:      id
```

Primary key is `id` for all tables. Additional indexed fields enable efficient queries.

## 8. Export / Import

- **Export:** `buildExportData()` serializes the full project state into a `PlanlineExport` JSON object with `version: 1`. The UI creates a Blob download.
- **Import:** `validateImportData()` performs exhaustive structural validation — type checks on every field, referential integrity for dependency→task and task→group references, positive duration enforcement. On valid data, `importProject()` clears all tables and bulk-inserts within a transaction.

## 9. Keyboard Navigation

Global keyboard shortcuts are managed by `useKeyboardShortcuts` hook, attached to `window.keydown`:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate tasks by sort order |
| `Delete` / `Backspace` | Remove selected task + its dependencies |
| `Escape` | Deselect task / exit edit mode |
| `Enter` | Add new task after selected (auto-edit mode) |
| `Tab` | Add dependent task (creates task + dependency) |
| `F2` | Start editing selected task name |

Shortcuts are suppressed when an `<input>` or `<textarea>` is focused (except Escape).

## 10. Performance Considerations

- **Selective scheduler runs:** `updateTask()` only re-runs the scheduler when `startDayIndex` or `durationDays` change. Cosmetic updates (name, color) skip it.
- **`React.memo` on TaskBar:** Prevents re-renders when unrelated tasks change.
- **Memoized sidebar sorting:** `useMemo` in `Sidebar` and `useKeyboardShortcuts` prevents re-sorting on every render.
- **Zustand selectors:** Components subscribe to individual fields, not the whole store, minimizing re-render scope.
- **SVG marker IDs:** `useId()` prevents collisions when multiple arrow instances exist.

## 11. File Dependency Graph

```
main.tsx
  └── App.tsx (src/)
        └── ui/App.tsx
              ├── store/useProjectStore.ts
              │     ├── domain/scheduler.ts
              │     │     └── domain/types.ts
              │     ├── domain/constants.ts
              │     ├── db/repository.ts
              │     │     └── db/db.ts
              │     │           └── domain/types.ts
              │     └── ui/constants.ts
              ├── ui/components/Sidebar.tsx
              ├── ui/components/Timeline.tsx
              │     ├── ui/components/TimelineHeader.tsx
              │     ├── ui/components/TimelineBody.tsx
              │     │     ├── ui/components/TaskBar.tsx
              │     │     └── ui/components/DependencyArrows.tsx
              │     ├── ui/components/TodayLine.tsx
              │     └── ui/components/ZoomToggle.tsx
              └── ui/hooks/useKeyboardShortcuts.ts
```
