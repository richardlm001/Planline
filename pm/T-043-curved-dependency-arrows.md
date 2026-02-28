# T-043 — Curved Dependency Arrow Lines

**Status:** Backlog
**Size:** S

## Problem

The dependency arrows between tasks are drawn with sharp right-angle turns using straight `L` segments (`M ... L ... L ... L ...`). This looks rigid and makes it harder to visually trace connections, especially when there are many overlapping arrows.

## Goal

Replace the squared/right-angle arrow paths with smooth, rounded/curved lines that look more polished and are easier to follow visually.

## Current Implementation

In `DependencyArrows.tsx`, arrows are drawn as:
```
const midX = sx + 12;
const path = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
```
This produces a Z-shaped path with 90° corners.

## Desired Behavior

Dependency lines should use smooth curves at the bends. Two approaches:

1. **Rounded corners** — Keep the same L-shaped routing but add arc segments (`A` or quadratic curves `Q`) at the two corners so the path looks rounded rather than sharp.
2. **Cubic Bezier** — Use a single `C` curve from source to target for a flowing line.

The recommended approach is **rounded corners** (option 1), as it preserves the clean horizontal-vertical-horizontal routing while looking softer. A corner radius of ~8–12px works well at typical zoom levels.

## Implementation Steps

1. In `DependencyArrows.tsx`, replace the straight `L` path construction with a rounded-corner path:
   - Compute the corner radius (e.g., `r = Math.min(12, Math.abs(ty - sy) / 2, Math.abs(midX - sx) / 2)`).
   - Build the path with quadratic or arc curves at the two bend points.
   - Example: `M sx sy → H (midX - r) → Q midX sy, midX (sy ± r) → V (ty ∓ r) → Q midX ty, (midX + r) ty → H tx`.
2. Apply the same rounding to both normal (solid) and collapsed-group (dashed) arrows.
3. Ensure the arrowhead marker still aligns properly with the curved path end.
4. Handle edge case: when `sy === ty` (same row), draw a simple horizontal line with no bends.
5. Handle edge case: when the horizontal or vertical segment is shorter than `2 * radius`, reduce the radius proportionally.

## Tests Required

- Arrows render without errors at various row distances.
- Same-row arrows render as a straight horizontal line.
- Collapsed-group dashed arrows also use rounded corners.

## Definition of Done

- All dependency arrows use smooth rounded corners instead of sharp right angles.
- Arrowheads render correctly at the endpoint.
- Edge cases (same row, short segments) are handled gracefully.
