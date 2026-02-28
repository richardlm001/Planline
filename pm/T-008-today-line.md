# T-008 — Today Line

**Status:** Backlog
**Size:** S

## Goal

Render a thin red vertical line on the timeline at today's date position. The line spans the full height of the timeline body.

## Non-Goals

- Interaction with the line.

## UX Notes

- 2px wide, red (#EF4444 or similar), semi-transparent.
- Spans from the header to the bottom of the timeline body.
- Always visible regardless of scroll position (vertically).

## Data Model Impact

None.

## Implementation Steps

1. Create `src/ui/components/TodayLine.tsx`.
   - Compute horizontal position: `(todayDayIndex - visibleRangeStart) * columnWidth`.
   - Render as an absolutely-positioned div with `height: 100%`.
2. Add to `Timeline.tsx` inside the scrollable area.

## Tests Required

- TodayLine renders at the correct `left` pixel offset for a given date.

## Definition of Done

- Red vertical line is visible at today's position on the timeline.
- Line is visually distinct but not overwhelming.
