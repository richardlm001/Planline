# T-007 — Task Bars Rendering

**Status:** Backlog
**Size:** M

## Goal

Render task bars on the timeline grid, positioned horizontally according to each task's `computedStart` and `durationDays`, and vertically according to the task's row index.

## Non-Goals

- Drag to move (T-011).
- Resize (T-012).
- Dependency arrows (T-014).
- Colors (use a single default color; T-018 adds the palette).

## UX Notes

- Each bar is a rounded rectangle sitting in the correct row, spanning the correct columns.
- Bar height ~28px with vertical padding to create row gaps.
- Row height ~40px.
- Bar shows the task name clipped with ellipsis if too short.
- Bar has a subtle shadow or border for depth.

## Data Model Impact

None. Reads `tasks` and `computedStarts` from the store.

## Implementation Steps

1. Create `src/ui/components/TaskBar.tsx` — renders one bar.
   - Props: `task`, `computedStart`, `columnWidth`, `rowIndex`.
   - Position: `left = (computedStart - visibleRangeStart) * columnWidth`, `width = durationDays * columnWidth`.
   - Use absolute positioning within the timeline body.
2. Create `src/ui/components/TimelineBody.tsx` — renders all task bars over the grid.
   - Maps over `tasks` (sorted by `sortOrder`) and renders a `TaskBar` per task.
   - Also renders horizontal row lines for visual clarity.
3. Wire into `Timeline.tsx` so bars appear over the grid.
4. Derive `rowIndex` from sorted task order.

## Tests Required

- `TaskBar` renders with correct left/width style given inputs.
- `TimelineBody` renders N bars for N tasks.

## Definition of Done

- Task bars appear at correct positions on the timeline.
- Bar text shows task name.
- Bars align with the date grid columns.
