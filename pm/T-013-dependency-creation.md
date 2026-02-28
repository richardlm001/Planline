# T-013 — Dependency Creation via Drag

**Status:** Backlog
**Size:** L

## Goal

Allow users to create a Finish-to-Start dependency by dragging from a connector on the right end of one bar to a connector on the left end of another bar.

## Non-Goals

- Other dependency types (Start-to-Start, etc.).
- Dependency editing or re-routing.
- Arrow rendering (T-014).

## UX Notes

- Each task bar shows small circular connectors:
  - **Right connector** (output): small dot/circle at the right edge, visible on hover.
  - **Left connector** (input): small dot/circle at the left edge, visible on hover.
- To create a dependency: mouse down on right connector of task A → drag → release on left connector of task B.
- While dragging, a temporary line follows the cursor from the source connector.
- If released on a valid target connector, the dependency is created.
- If released elsewhere, nothing happens (line disappears).
- If the dependency would create a cycle, show a brief error toast and reject it.

## Data Model Impact

Creates a new `Dependency` record.

## Implementation Steps

1. Add connector elements to `TaskBar.tsx` (right-side output dot, left-side input dot).
   - Connectors appear on hover with a short opacity transition.
2. Create a drag interaction system for dependency creation:
   - `onPointerDown` on output connector → enter "linking" mode.
   - Store source task ID in state.
   - Render a temporary SVG/canvas line from source to cursor.
   - `onPointerUp` on an input connector → attempt to create dependency.
3. In the store's `addDependency()`:
   - Add the dependency.
   - Run scheduler.
   - If result is a cycle error, revert the dependency and surface the error.
4. Add a temporary line component that renders during link-drag.
5. Add state to store or local context: `linkingFrom: string | null`.

## Tests Required

- Creating a dependency A → B persists it and shifts B if needed.
- Creating a cyclic dependency is rejected.
- Releasing on empty space does nothing.

## Definition of Done

- Users can drag from one bar's right connector to another bar's left connector to create a dependency.
- Cyclic dependencies are rejected with feedback.
- The dependency appears in the store and affects scheduling.
