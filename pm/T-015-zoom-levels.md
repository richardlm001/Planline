# T-015 — Zoom Levels (Day / Week / Month)

**Status:** Backlog
**Size:** M

## Goal

Add a zoom toggle (Day / Week / Month) that changes the timeline column width and date header labels. Three discrete modes — no continuous zoom.

## Non-Goals

- Pinch-to-zoom or scroll-to-zoom.
- Custom zoom levels.

## UX Notes

- Toggle control in the top-right of the timeline area or in a toolbar.
- Three buttons or a segmented control: D | W | M.
- **Day mode** (default): 1 column = 1 day, ~40px wide. Header shows "17 Mon".
- **Week mode**: 1 column = 1 week, ~40px wide (so 7 days compressed). Header shows "Dec 16–22".
- **Month mode**: 1 column = 1 month, ~60px wide. Header shows "Dec 2018".
- Task bars scale proportionally: width in pixels = duration * (columnWidth / daysPerColumn).
- Today line position adjusts accordingly.
- Viewport should try to keep the same center date when switching zoom.

## Data Model Impact

Add `zoomLevel: 'day' | 'week' | 'month'` to store (persisted or ephemeral — not critical).

## Implementation Steps

1. Define zoom config: `{ day: { columnWidth: 40, daysPerColumn: 1 }, week: { ... }, month: { ... } }`.
2. Add `zoomLevel` state + `setZoomLevel` action to store.
3. Update `TimelineHeader.tsx` to generate columns based on zoom level.
4. Update `TaskBar.tsx` positioning math to use `daysPerColumn`.
5. Update `TodayLine.tsx` positioning.
6. Create `src/ui/components/ZoomToggle.tsx` — segmented control.
7. On zoom change, adjust `scrollLeft` to maintain center date.

## Tests Required

- Zoom config produces correct column widths.
- Bar position math works for all three zoom levels.

## Definition of Done

- Three zoom levels switchable via UI toggle.
- Timeline grid, bars, and today line render correctly at each level.
- Center date is preserved when switching.
