# T-032: Timeline Re-sorts and Re-filters Tasks on Every Render

**Priority:** Medium  
**Category:** Performance

## Problem

Several components sort and filter the entire task array on every render without memoization:

1. **`TimelineBody`**: `[...tasks].sort().filter()` on every render
2. **`DependencyArrows`**: `[...tasks].sort().filter()` + builds two Maps on every render
3. **`Sidebar`**: `[...tasks].sort()` + `[...groups].sort()` + builds grouped Map on every render

These operations are O(n log n) and allocate new arrays/maps on every render, even when the underlying data hasn't changed. React re-renders these components on every state change (including selections, hover states, etc.).

## Location

- [src/ui/components/TimelineBody.tsx](../src/ui/components/TimelineBody.tsx)
- [src/ui/components/DependencyArrows.tsx](../src/ui/components/DependencyArrows.tsx)
- [src/ui/components/Sidebar.tsx](../src/ui/components/Sidebar.tsx)

## Expected Behavior

Wrap sorting/filtering/mapping operations in `useMemo` with appropriate dependency arrays:

```tsx
const sortedTasks = useMemo(() =>
  [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((t) => !t.groupId || !collapsedGroupIds.has(t.groupId)),
  [tasks, collapsedGroupIds]
);
```

## Acceptance Criteria

- [ ] All sorting/filtering operations are memoized with `useMemo`
- [ ] Map construction (taskIndexMap, taskMap) is memoized
- [ ] No unnecessary re-computations when unrelated state changes
