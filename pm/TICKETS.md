# Planline — Ticket Index

Tickets are listed in recommended implementation order.
Each ticket is a self-contained unit of work.

| #     | Ticket                                               | Size | Status  |
| ----- | ---------------------------------------------------- | ---- | ------- |
| T-001 | [Project scaffolding](T-001-project-scaffolding.md)  | S    | Backlog |
| T-002 | [Data model & types](T-002-data-model.md)            | S    | Backlog |
| T-003 | [Scheduling engine — propagation](T-003-scheduling-engine.md) | M | Backlog |
| T-004 | [Scheduling engine — cycle detection](T-004-cycle-detection.md) | S | Backlog |
| T-005 | [Zustand store & Dexie persistence](T-005-state-persistence.md) | M | Backlog |
| T-006 | [Timeline grid layout & header](T-006-timeline-grid-layout.md) | M | Backlog |
| T-007 | [Task bars rendering](T-007-task-bars-rendering.md)  | M    | Backlog |
| T-008 | [Today line](T-008-today-line.md)                    | S    | Backlog |
| T-009 | [Sidebar task list & inline rename](T-009-sidebar-task-list.md) | M | Backlog |
| T-010 | [Add task (button + ENTER)](T-010-add-task.md)        | S    | Backlog |
| T-011 | [Drag to move tasks](T-011-drag-move.md)             | M    | Backlog |
| T-012 | [Resize task bars](T-012-resize-bars.md)             | M    | Backlog |
| T-013 | [Dependency creation via drag](T-013-dependency-creation.md) | L | Backlog |
| T-014 | [Dependency arrow rendering](T-014-dependency-arrows.md) | M | Backlog |
| T-015 | [Zoom levels (Day / Week / Month)](T-015-zoom-levels.md) | M | Backlog |
| T-016 | [Keyboard navigation & delete](T-016-keyboard-navigation.md) | M | Backlog |
| T-017 | [Task groups (visual)](T-017-task-groups.md)          | M    | Backlog |
| T-018 | [Task bar colors](T-018-task-bar-colors.md)          | S    | Backlog |
| T-019 | [Project name (inline edit)](T-019-project-name.md)   | S    | Backlog |
| T-020 | [Export / Import JSON](T-020-export-import.md)        | S    | Backlog |
| T-021 | [Weekend shading & viewport polish](T-021-weekend-shading-polish.md) | S | Backlog |

## Audit Findings (Post-MVP)

| #     | Ticket                                               | Size | Priority | Status  |
| ----- | ---------------------------------------------------- | ---- | -------- | ------- |
| T-022 | [removeGroup orphans tasks](T-022-remove-group-orphans-tasks.md) | S | Critical | Done |
| T-023 | [Duplicate dependency prevention](T-023-duplicate-dependency-prevention.md) | S | High | Done |
| T-024 | [Import validation insufficient](T-024-import-validation-insufficient.md) | M | High | Done |
| T-025 | [Import operation not atomic](T-025-import-not-atomic.md) | S | High | Done |
| T-026 | [No error handling on async actions](T-026-no-error-handling-async-actions.md) | L | High | Done |
| T-027 | [SortOrder fragmentation](T-027-sortorder-fragmentation.md) | S | Medium | Done |
| T-028 | [Month zoom pixelsPerDay inaccurate](T-028-month-zoom-pixels-per-day.md) | M | Medium | Done |
| T-029 | [Dependency arrows + collapsed groups](T-029-dependency-arrows-collapsed-groups.md) | M | Medium | Done |
| T-030 | [Drag uses computedStart vs startDayIndex](T-030-drag-computed-vs-stored-start.md) | M | Medium | Done |
| T-031 | [Scheduler runs unnecessarily](T-031-scheduler-runs-unnecessarily.md) | S | Medium | Done |
| T-032 | [Unmemoized sort/filter in components](T-032-unmemoized-sort-filter.md) | S | Medium | Done |
| T-033 | [TaskBar unnecessary re-renders](T-033-taskbar-unnecessary-rerenders.md) | S | Medium | Done |
| T-034 | [Today index stale after midnight](T-034-today-index-stale-after-midnight.md) | S | Medium | Done |
| T-035 | [SVG marker ID collision risk](T-035-svg-marker-id-collision.md) | S | Medium | Done |
| T-036 | [Keyboard hook sortedTasks not memoized](T-036-keyboard-hook-sortedtasks-not-memoized.md) | S | Medium | Done |
| T-037 | [Expand test coverage](T-037-expand-test-coverage.md) | L | Medium | Done |
