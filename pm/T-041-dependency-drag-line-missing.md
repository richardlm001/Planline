# T-041 — Dependency Linking Drag Line Not Rendering

**Status:** Done
**Size:** M
**Category:** Bug

## Problem

The dependency creation feature (T-013) is partially implemented: the store has `linkingFromTaskId`, connectors (dots) appear on task bar hover, and `pointerDown`/`pointerUp` handlers are wired. However, no temporary line follows the cursor during the drag. When the user presses the right connector dot and drags, nothing visual happens — the user gets no feedback that a linking operation is in progress.

The root cause is that T-013 step 4 ("Add a temporary line component that renders during link-drag") was never implemented.

## Expected Behavior

1. User presses the right (output) connector dot on task A.
2. A line (SVG path or similar) immediately starts drawing from the connector to the cursor position.
3. As the user drags (without releasing), the line follows the cursor in real-time.
4. If the user releases on a left (input) connector of task B, the dependency is created.
5. If the user releases elsewhere, the line disappears and no dependency is created.

## Implementation Steps

1. Create a `LinkingLine` component (SVG overlay) that renders when `linkingFromTaskId` is set:
   - Determine the source point: the right-edge center of the source task bar (from `computedStarts`, `durationDays`, `pixelsPerDay`, row index).
   - Track the current cursor position via `pointermove` on the timeline container.
   - Draw an SVG `<line>` or `<path>` from source point to cursor position.
   - Style with a dashed stroke and a color that stands out (e.g., orange or blue).
2. Mount `LinkingLine` inside the timeline body (or as a sibling SVG overlay alongside `DependencyArrows`).
3. On `pointerup` anywhere (not on a valid connector), clear `linkingFromTaskId` to cancel linking.
4. Ensure the linking line accounts for scroll position of the timeline container.
5. Verify that completing a link (dropping on a valid input connector) still works correctly and the line disappears.

## Tests Required

- When `linkingFromTaskId` is set, the `LinkingLine` component renders.
- When `linkingFromTaskId` is cleared, the `LinkingLine` component unmounts.
- Creating a valid dependency A→B works end-to-end (connector down → drag → connector up).
- Releasing on empty space clears linking state without creating a dependency.

## Definition of Done

- A visible line follows the cursor from the source connector during dependency linking drag.
- Releasing on a valid input connector creates the dependency.
- Releasing elsewhere cancels without side effects.
- The linking line accounts for timeline scroll position.

## Changelog

- Created `LinkingLine.tsx` component that renders an SVG dashed line from the source task's right edge to the cursor during dependency linking.
- Uses `pointermove` on window to track cursor position, accounting for scroll offset of the timeline container.
- Cancels linking on `pointerup` if not on a valid input connector.
- Mounted inside `Timeline.tsx` alongside `TodayLine` with `z-30` to render above dependency arrows.
- All 118 tests pass.
