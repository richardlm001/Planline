# T-029: DependencyArrows Row Indices Mismatch After Group Collapse

**Priority:** Medium  
**Category:** Bug (fixed partially — see notes)

## Problem

The `DependencyArrows` component was computing arrow positions using **all** tasks sorted by `sortOrder`, while `TimelineBody` filters out tasks that belong to collapsed groups. This meant dependency arrows pointed to wrong row positions when groups were collapsed, as the row indices diverged between the two components.

**Partial fix applied:** The `DependencyArrows` component now filters collapsed group tasks to match `TimelineBody`, so row indices align. However, this means arrows for dependencies involving collapsed-group tasks are silently hidden — there's no visual indicator that hidden dependencies exist.

## Remaining Issue

When a group is collapsed, dependencies involving its member tasks simply disappear. Consider:
- Showing a summary arrow from the collapsed group header to the dependency target
- Or showing a visual indicator on the collapsed group that it has external dependencies

## Location

- [src/ui/components/DependencyArrows.tsx](../src/ui/components/DependencyArrows.tsx)
- [src/ui/components/TimelineBody.tsx](../src/ui/components/TimelineBody.tsx)

## Acceptance Criteria

- [ ] Dependency arrows align with task bar positions at all times
- [ ] Collapsed groups show an indicator for hidden dependencies (optional enhancement)
- [ ] Unit test verifying arrow positions match task bar positions after group collapse
