# T-002 — Data Model & Types

**Status:** Backlog
**Size:** S

## Goal

Define the core TypeScript types/interfaces for Task, Dependency, Group, and Project. Set up the Dexie database schema so data can be persisted from T-005 onward.

## Non-Goals

- No store logic (T-005).
- No scheduling logic (T-003).
- No UI.

## UX Notes

N/A — types and schema only.

## Data Model Impact

This ticket **defines** the data model:

```ts
interface Task {
  id: string;           // nanoid
  name: string;
  startDayIndex: number; // integer offset from PROJECT_EPOCH
  durationDays: number;  // >= 1
  groupId?: string;
  color: string;         // hex from palette
  sortOrder: number;     // for sidebar ordering
}

interface Dependency {
  id: string;
  fromTaskId: string;    // predecessor
  toTaskId: string;      // successor
}

interface Group {
  id: string;
  name: string;
  collapsed: boolean;
  sortOrder: number;
}

interface Project {
  id: string;            // singleton, always "default"
  name: string;          // default "Project 01"
  epoch: string;         // ISO date string, e.g. "2024-01-01"
}
```

`PROJECT_EPOCH` is a fixed date from which `startDayIndex` is calculated. Using `differenceInCalendarDays(date, epoch)`.

## Implementation Steps

1. Create `src/domain/types.ts` with all interfaces above.
2. Create `src/domain/constants.ts` with `PROJECT_EPOCH`, color palette array, default values.
3. Create `src/db/schema.ts` with Dexie database class:
   - Table `tasks` indexed on `id`, `groupId`, `sortOrder`.
   - Table `dependencies` indexed on `id`, `fromTaskId`, `toTaskId`.
   - Table `groups` indexed on `id`, `sortOrder`.
   - Table `project` indexed on `id`.
4. Create `src/db/db.ts` that instantiates the Dexie database singleton.
5. Install `nanoid` for ID generation.

## Tests Required

- Type compile check (TypeScript strict mode is the test).
- One test that opens the Dexie DB and writes/reads a task (can use in-memory Dexie or fake-indexeddb).

## Definition of Done

- All types exported from `src/domain/types.ts`.
- Dexie schema defined and DB instance exported.
- Types compile under strict TypeScript.
- DB read/write test passes.
