# T-031: Scheduler Runs on Every State Change (Performance)

**Priority:** Medium  
**Category:** Performance

## Problem

The `runScheduler()` function (topological sort + propagation) is called synchronously on every task/dependency mutation:
- `addTask` — runs scheduler
- `updateTask` — runs scheduler (even for name/color changes that don't affect scheduling)
- `removeTask` — runs scheduler
- `addDependency` — runs scheduler
- `removeDependency` — runs scheduler

For non-scheduling changes (renaming a task, changing color), calling the scheduler is unnecessary overhead. While the scheduler is currently O(V + E), this becomes costly as the project grows to hundreds of tasks.

## Location

- [src/store/useProjectStore.ts](../src/store/useProjectStore.ts) — `runScheduler` called in `addTask`, `updateTask`, `removeTask`, `addDependency`, `removeDependency`

## Expected Behavior

Only run the scheduler when scheduling-relevant fields change:
- `startDayIndex`
- `durationDays`
- Dependencies added/removed
- Tasks added/removed

Skip scheduling for:
- `name`, `color`, `groupId`, `sortOrder` changes

## Acceptance Criteria

- [ ] `updateTask` with non-scheduling fields skips scheduler
- [ ] Scheduler still runs for all scheduling-relevant changes
- [ ] Consider memoizing/caching the scheduler result
