# T-006 — Timeline Grid Layout & Header

**Status:** Backlog
**Size:** M

## Goal

Build the shell layout: a fixed-width left sidebar and a horizontally-scrollable right timeline area with a date header row. This ticket renders the **grid columns and date labels** only — no task bars yet.

## Non-Goals

- Task bars (T-007).
- Today line (T-008).
- Zoom toggling (T-015) — but the grid must accept a `zoomLevel` prop so it can be added later.
- Task list in sidebar (T-009).

## UX Notes

- Left sidebar: ~260px fixed width, light background.
- Right panel: scrollable, fills remaining width.
- Header row: shows date labels. In Day mode, show day number + abbreviated weekday (e.g., "17 Mon"). One column per day.
- Columns should have subtle vertical grid lines.
- Default column width for Day mode: ~40px.
- The timeline should scroll to center today on mount.

## Data Model Impact

None.

## Implementation Steps

1. Create `src/ui/App.tsx` — top-level layout with flex: sidebar + timeline.
2. Create `src/ui/components/Sidebar.tsx` — empty placeholder panel.
3. Create `src/ui/components/Timeline.tsx` — scrollable container.
4. Create `src/ui/components/TimelineHeader.tsx` — renders date columns.
5. Compute visible date range: show ~90 days centered on today (for Day mode). Use `date-fns` to generate column data.
6. Timeline container uses `overflow-x: auto` and renders a wide inner div.
7. Use `useRef` + `scrollLeft` to center on today on mount.
8. Accept `columnWidth` and `zoomLevel` as props/context for future zoom support.

## Tests Required

- Component renders without crashing (smoke test with testing-library).

## Definition of Done

- App shows a two-panel layout.
- Right panel displays a scrollable grid of day columns with date labels.
- Viewport is centered on today on initial load.
- No task bars yet — just the empty grid.
