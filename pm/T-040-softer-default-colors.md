# T-040 — Softer Default Color Palette

**Status:** Done
**Size:** S

## Goal

Replace the current vivid/saturated `COLOR_PALETTE` with softer, pastel-toned colors that look more gentle and professional. The entire palette (defaults and picker) should use the softer variants.

## Non-Goals

- Adding more colors to the palette.
- Per-task opacity or transparency controls.
- Changing the color picker UI layout.

## Current Colors

```ts
export const COLOR_PALETTE = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];
```

## New Palette

Softer/pastel variants of the same 10 hues — lower saturation, higher lightness, matching the style in the reference screenshot (light purple, soft pink, muted yellow-green, pale coral, etc.):

```ts
export const COLOR_PALETTE = [
  '#93B5F7', // soft blue
  '#7DD3B6', // soft emerald
  '#FCD077', // soft amber
  '#F9A8A8', // soft coral/red
  '#BFA8F7', // soft violet
  '#F4A8CC', // soft pink
  '#7DD8E8', // soft cyan
  '#FCBB7D', // soft orange
  '#7DD3C4', // soft teal
  '#A5A7F5', // soft indigo
];
```

*(Exact hex values to be tuned during implementation for visual harmony.)*

## Implementation Steps

1. Update `COLOR_PALETTE` in `src/domain/constants.ts` with the new soft colors.
2. Update the task bar text/label contrast: since backgrounds are lighter, verify that the task name label color (currently likely white or dark) remains readable against each new color. Adjust as needed.
3. Update any test fixtures that hard-code specific color hex values (e.g., `'#3B82F6'`) to use the new values — or better, reference `COLOR_PALETTE[0]` instead.
4. Visually verify all 10 colors on task bars and in the color picker to ensure they look harmonious.

## Tests Required

- Existing tests pass with updated color values.
- New task creation assigns a color from the updated palette.

## Definition of Done

- The color palette uses softer, pastel-toned colors throughout.
- Task bars and color picker both reflect the new palette.
- Text labels remain readable on all bar colors.
- All existing tests pass.

## Changelog

- Replaced all 10 `COLOR_PALETTE` entries in `src/domain/constants.ts` with softer pastel-toned hexes.
- Tests use `COLOR_PALETTE[n]` references and pass without changes since they don't hardcode specific hex values against the palette.
- All 118 tests pass.
