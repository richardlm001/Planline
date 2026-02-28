# T-042 — Zoom Level Change Leaves Future Dates Empty

**Status:** Done
**Size:** S
**Category:** Bug

## Problem

When the user changes the zoom level (Day / Week / Month), future dates beyond the initial viewport are not rendered — the canvas appears empty/blank for dates in the future. The timeline grid columns, weekend shading, and header labels stop at some point, leaving a white void.

The likely root cause is the `VISIBLE_DAYS = 90` constant, which limits column generation to a fixed 90-day window. When switching zoom levels (especially to Week or Month), the viewport can physically display more calendar time, but the column generator still only produces ~90 days of columns, leaving the rest of the canvas empty.

## Expected Behavior

- At all zoom levels, the timeline renders enough columns to fill the visible viewport plus reasonable overflow for scrolling.
- Switching zoom levels immediately produces a fully-populated grid — no blank areas for future (or past) dates.

## Implementation Steps

1. Investigate the column generation logic in `Timeline.tsx` — specifically how `VISIBLE_DAYS` limits the range.
2. Make the visible range dynamic based on zoom level:
   - At Day zoom (1 day/column, 40px): 90 days ≈ 3600px — typically sufficient.
   - At Week zoom (7 days/column, 40px): 90 days = ~13 columns = 520px — far too narrow for most screens.
   - At Month zoom (30 days/column, 60px): 90 days = 3 columns = 180px — extremely too narrow.
3. Replace the fixed `VISIBLE_DAYS` with a dynamic calculation: `visibleDays = Math.max(VISIBLE_DAYS, Math.ceil(viewportWidth / pixelsPerDay) + buffer)` or compute per-zoom-level minimums.
4. Alternatively, compute `VISIBLE_DAYS` per zoom config as a multiple of `daysPerColumn` to ensure enough columns fill the screen.
5. Verify that header labels, grid lines, and weekend shading all render for the extended range.
6. Test at different browser/window widths to ensure no blank areas appear.

## Tests Required

- At Week zoom, the generated column count covers at least the viewport width.
- At Month zoom, the generated column count covers at least the viewport width.
- Switching from Day → Month → Day doesn't leave blank areas.

## Definition of Done

- At all zoom levels, the timeline grid fills the viewport with no blank/empty areas for future dates.
- Column generation adapts to the zoom level and viewport size.
- Header labels, grid lines, and shading render for the full visible range.

## Changelog

- Replaced fixed `VISIBLE_DAYS = 90` with `getVisibleDays(zoomLevel, viewportWidth)` in `src/ui/constants.ts`.
- `Timeline.tsx` now measures container width via `useState` + `resize` listener and passes it to `getVisibleDays`.
- For week zoom, the function computes enough days to fill the viewport (e.g., 1920px / (40/7) ≈ 336 days); for month zoom, it similarly scales.
- Removed the `halfRange * 3` hack for month zoom since the dynamic calculation now handles it.
- All 118 tests pass.
