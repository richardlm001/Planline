# T-028: Month Zoom pixelsPerDay Uses Hardcoded 30-Day Approximation

**Priority:** Medium  
**Category:** Bug

## Problem

In `Timeline.tsx`, the `pixelsPerDay` calculation for month zoom uses a hardcoded divisor of 30:

```ts
// Month: approximate using 30 days
return columnWidth / 30;
```

However, month columns have variable `daysSpan` (28, 29, 30, or 31 days). This means:
- Task bar widths are inaccurate in February (28/29 days → bars appear ~7% too wide)
- Task bar positions drift from expected pixel positions
- The `dayToPixel` function correctly handles variable column widths, but `pixelsPerDay` does not

The `pixelsPerDay` value is passed to `TaskBar` for drag/resize calculations, meaning drag-to-move and resize operations snap to incorrect day boundaries in month view.

## Location

- [src/ui/components/Timeline.tsx](../src/ui/components/Timeline.tsx) — `pixelsPerDay` memo (line ~103)

## Impact

- Task bars in month view have incorrect widths (especially February)
- Drag-move and resize snap to wrong day boundaries in month view
- Visual misalignment between task bars and month column boundaries

## Expected Behavior

For month zoom, `pixelsPerDay` should not be used as a fixed value. Instead, drag/resize operations should use the `dayToPixel` function for mapping pixel deltas to day deltas, accounting for variable column widths.

## Acceptance Criteria

- [ ] Task bars display correct widths in month view across all months
- [ ] Drag and resize operations snap accurately in month view
- [ ] February and 31-day months render correctly
