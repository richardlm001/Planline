# T-033: TaskBar Re-renders All Bars on Any Task Selection

**Priority:** Medium  
**Category:** Performance

## Problem

The `TaskBar` component subscribes to `selectedTaskId` from the store:

```tsx
const selectedTaskId = useProjectStore((s) => s.selectedTaskId);
```

When `selectedTaskId` changes, **all** TaskBar instances re-render (not just the newly selected and previously selected ones), because every TaskBar subscribes to this value. Each re-render recalculates positions, creates callbacks, etc.

Similarly, `linkingFromTaskId` causes all TaskBars to re-render when linking mode is toggled.

## Location

- [src/ui/components/TaskBar.tsx](../src/ui/components/TaskBar.tsx) — store subscriptions (lines ~30-34)

## Expected Behavior

Use a derived selector so each TaskBar only re-renders when its own selection state changes:

```tsx
const isSelected = useProjectStore((s) => s.selectedTaskId === task.id);
const isLinking = useProjectStore((s) => s.linkingFromTaskId !== null);
```

Additionally, consider wrapping `TaskBar` with `React.memo` to prevent re-renders from parent updates.

## Acceptance Criteria

- [ ] TaskBar uses derived selectors for `isSelected` and `isLinking`
- [ ] TaskBar wrapped with `React.memo`
- [ ] Only affected TaskBars re-render on selection change
