# T-018 — Task Bar Colors

**Status:** Backlog
**Size:** S

## Goal

Auto-assign colors to new tasks from a curated palette, and allow users to change a task's color from a predefined list.

## Non-Goals

- Custom hex input.
- Group-based coloring.

## UX Notes

- Curated palette of ~8–10 calm, pleasant colors that match the app's minimal aesthetic.
- New tasks get the next color in rotation (cycling through the palette).
- To change color: click a small color dot/swatch on the task bar or in the sidebar row → shows a small popover with color options.
- Selected color is indicated with a checkmark.

## Data Model Impact

Uses `task.color` field from T-002.

## Implementation Steps

1. Define the color palette in `src/domain/constants.ts` (already stubbed in T-002).
   - Include ~10 colors: soft blue, green, orange, pink, purple, teal, amber, red, indigo, lime.
2. Update `addTask()` in store to assign the next color via round-robin.
3. Create `src/ui/components/ColorPicker.tsx`:
   - Small popover showing color swatches.
   - Clicking a swatch updates the task color.
4. Add a color-dot trigger to `TaskBar.tsx` or `SidebarTaskRow.tsx` (visible on hover/select).
5. Apply the task color as the bar's background color.

## Tests Required

- New tasks cycle through the palette.
- Changing a task's color persists.

## Definition of Done

- Task bars display their assigned color.
- Users can change a task's color from a palette popover.
- Colors are visually pleasant and consistent.
