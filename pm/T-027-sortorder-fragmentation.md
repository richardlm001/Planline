# T-027: SortOrder Fragmentation Causes Precision Issues

**Priority:** Medium  
**Category:** Bug

## Problem

When inserting tasks via Enter or Tab keyboard shortcuts, the new task's `sortOrder` is set to `existingTask.sortOrder + 0.5`. Repeated insertions at the same position generate values like:

```
1.0 → 1.5 → 1.5 (collision!) or 1.25 → 1.125 → ...
```

Problems:
1. **Collision**: Two tasks can end up with the same `sortOrder` value (inserting after the same task twice gives both `sortOrder + 0.5`)
2. **Precision**: After many insertions, floating-point precision degrades and sort order becomes unpredictable
3. **No normalization**: Sort orders are never re-normalized to clean integer values

## Location

- [src/ui/hooks/useKeyboardShortcuts.ts](../src/ui/hooks/useKeyboardShortcuts.ts) — lines 79, 100 (`sortOrder + 0.5`)

## Expected Behavior

After inserting a task at a fractional position, the sort orders of all tasks should be re-normalized to sequential integers. Alternatively, compute the midpoint between the target task and the next task.

## Acceptance Criteria

- [ ] Inserting a task between two existing tasks produces a unique sort order
- [ ] Sort orders are normalized after insertion (or use proper midpoint calculation)
- [ ] Repeated insertions at the same position produce correct ordering
- [ ] Unit test for repeated insert-after operations
