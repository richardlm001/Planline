# T-025: Import Operation is Not Atomic (Data Loss Risk)

**Priority:** High  
**Category:** Bug

## Problem

In `importProject()`, the existing data is cleared and new data is written in two separate `Promise.all` blocks:

```ts
// Step 1: Clear everything
await Promise.all([db.tasks.clear(), db.dependencies.clear(), ...]);

// Step 2: Write new data
await Promise.all([db.tasks.bulkPut(data.tasks), ...]);
```

If the browser crashes, tab is closed, or an error occurs between step 1 and step 2, **all data is lost** — the old data has been deleted but the new data hasn't been written yet.

## Location

- [src/db/export.ts](../src/db/export.ts) — `importProject()` (line ~40)

## Expected Behavior

The entire clear-and-write operation should be wrapped in a Dexie transaction to ensure atomicity:

```ts
export async function importProject(data: PlanlineExport): Promise<void> {
  await db.transaction('rw', [db.tasks, db.dependencies, db.groups, db.project], async () => {
    await Promise.all([
      db.tasks.clear(),
      db.dependencies.clear(),
      db.groups.clear(),
      db.project.clear(),
    ]);
    await Promise.all([
      db.tasks.bulkPut(data.tasks),
      db.dependencies.bulkPut(data.dependencies),
      db.groups.bulkPut(data.groups),
      db.project.put(data.project),
    ]);
  });
}
```

## Acceptance Criteria

- [ ] Import uses a Dexie transaction
- [ ] Failed import rolls back (old data preserved)
- [ ] Unit test simulating a write failure verifies rollback
