# T-022: removeGroup Does Not Unassign Orphaned Tasks

**Priority:** Critical  
**Category:** Bug

## Problem

When a group is deleted via `removeGroup()`, the tasks that belonged to that group retain their `groupId` reference to the now-deleted group. These orphaned tasks:

1. Are not visible in the Sidebar (they are neither ungrouped nor associated with an existing group)
2. Are not visible on the Timeline (the `TimelineBody` filters out tasks whose `groupId` doesn't match any existing group)
3. **Data loss**: The tasks still exist in the database but are effectively invisible to the user

## Location

- [src/store/useProjectStore.ts](../src/store/useProjectStore.ts) — `removeGroup` action (line ~237)

## Expected Behavior

When a group is removed, all tasks belonging to that group should have their `groupId` cleared (`undefined`), so they revert to ungrouped tasks visible in the sidebar and timeline.

## Fix

In `removeGroup`, also update tasks that reference the deleted group:

```ts
removeGroup: async (id: string) => {
  const state = get();
  const newGroups = state.groups.filter((g) => g.id !== id);
  const newTasks = state.tasks.map((t) =>
    t.groupId === id ? { ...t, groupId: undefined } : t
  );
  const schedule = runScheduler(newTasks, state.dependencies);

  set({
    groups: newGroups,
    tasks: newTasks,
    ...schedule,
    lastSavedAt: new Date(),
  });

  // Persist changes
  await repo.deleteGroup(id);
  for (const t of newTasks.filter((t) => t.groupId === undefined)) {
    await repo.saveTask(t);
  }
};
```

## Acceptance Criteria

- [ ] Deleting a group moves its tasks to "ungrouped"
- [ ] Orphaned tasks remain visible in both sidebar and timeline
- [ ] Changes are persisted to IndexedDB
- [ ] Unit test covering group deletion with child tasks
