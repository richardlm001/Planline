# T-014 — Dependency Arrow Rendering

**Status:** Backlog
**Size:** M

## Goal

Render visible arrows on the timeline for each Finish-to-Start dependency: from the right edge of the predecessor bar to the left edge of the successor bar.

## Non-Goals

- Arrow interaction (click to select/delete — handled via keyboard in T-016).
- Curved path routing (keep it simple).

## UX Notes

- Thin lines (1.5–2px) with an arrowhead at the successor end.
- Color: muted gray (#9CA3AF) by default.
- Lines route simply:
  - Horizontal from predecessor right edge → bend down/up → horizontal to successor left edge.
  - If bars are on adjacent rows and non-overlapping, a straight angled line is fine.
- Arrows should not obscure task bars — render in a layer behind or with low opacity.
- When a task is selected, its dependency arrows could be highlighted (slightly bolder/darker) — nice-to-have.

## Data Model Impact

None. Reads `dependencies`, `tasks`, and `computedStarts` from store.

## Implementation Steps

1. Create `src/ui/components/DependencyArrows.tsx`:
   - Renders an SVG overlay on the timeline body.
   - For each dependency, compute:
     - Source point: right edge center of predecessor bar.
     - Target point: left edge center of successor bar.
   - Draw a path (line + arrowhead marker).
2. Simple path routing:
   - If source and target are on different rows, use an L-shaped or S-shaped path.
   - Use SVG `<path>` with `M`, `L` or `C` commands.
3. Add SVG `<marker>` definition for the arrowhead.
4. Layer the SVG behind task bars (via z-index or DOM order).

## Tests Required

- Arrows render for each dependency in the store.
- Arrow start/end positions are correct given task positions.

## Definition of Done

- Each dependency is visualized as an arrow on the timeline.
- Arrows update when tasks move or resize.
- Visual is clean and non-intrusive.
