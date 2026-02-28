# T-044 — Right-Edge Resize Blocked by Connector Dot

**Status:** Backlog
**Size:** S
**Category:** Bug

## Problem

Users cannot drag the right edge of a task bar to resize it (change duration). When hovering over the right side of a task bar, the dependency output connector dot (blue circle, `z-20`) appears and covers the resize handle (`z-10`, 6px wide). Because the connector has higher z-index and appears on hover, it intercepts all pointer events, making it impossible to reach the resize handle underneath.

The left-edge resize works fine because the left (input) connector only shows during active linking mode, not on general hover.

## Expected Behavior

Users should be able to:
1. Easily resize a task bar by dragging its right edge (cursor shows `col-resize`).
2. Still access the output connector to create dependencies.

Both interactions must be available without interfering with each other.

## Root Cause

In `TaskBar.tsx`:
- Right resize handle: `absolute right-0`, `z-10`, `width: 6px`.
- Right connector: `absolute -right-2`, `z-20`, `opacity-0 group-hover:opacity-100`.

The connector sits on top of the resize handle, and since it becomes visible and interactive on hover, the resize handle is effectively unreachable.

## Proposed Solution

Separate the two interactions spatially and/or by trigger:

**Option A — Offset the connector further outside the bar** (recommended):
- Move the output connector further right (e.g., `-right-3.5` or `-right-4`) so it sits clearly outside the bar's right edge. The resize handle zone stays inside the bar. This way hovering the bar edge shows `col-resize` and hovering the dot (outside the bar) shows `crosshair`.

**Option B — Show connector only on modifier key or after a pause:**
- Only show the connector dot when holding Alt/Option, or after hovering for 500ms, keeping the default hover as resize.

## Implementation Steps

1. Move the right output connector further outside the bar so it doesn't overlap the resize handle.
2. Optionally increase the resize handle width slightly (e.g., from 6px to 8px) for easier targeting.
3. Verify that the left connector doesn't cause the same issue (currently it only shows during linking, so it should be fine).
4. Test that dependency creation via connector still works after the position change.
5. Ensure the connector is still visually associated with the bar (not floating too far away).

## Tests Required

- Right-edge resize handle is accessible and changes duration on drag.
- Right connector is still clickable and initiates dependency linking.
- Both interactions don't overlap / interfere.

## Definition of Done

- Users can resize task bars by dragging the right edge without the connector interfering.
- Dependency creation via the right connector still works.
- Both cursors (`col-resize` for resize, `crosshair` for connector) appear in the correct zones.
