# T-021 — Weekend Shading & Viewport Polish

**Status:** Backlog
**Size:** S

## Goal

Visually distinguish weekend columns on the timeline and polish the initial viewport experience.

## Non-Goals

- Non-working days (weekends still count for duration).
- Custom working days.

## UX Notes

- Weekend columns (Saturday, Sunday) have a subtle background tint (e.g., light gray `#F9FAFB` or similar).
- This helps users visually orient dates without affecting scheduling.
- On initial load, the viewport scrolls to center on today.
- Add a "Saved on device" indicator: small text at the bottom of the sidebar or in the toolbar, e.g., "💾 Saved on device" with a subtle timestamp or just a static label.
- The indicator confirms data is stored locally and persists.

## Data Model Impact

None.

## Implementation Steps

1. Update `TimelineHeader.tsx` and `TimelineBody.tsx`:
   - When generating day columns, check `isWeekend(date)` via date-fns.
   - Apply a subtle background class to weekend columns.
2. Ensure weekend shading works in Day and Week zoom modes (Month mode can skip it).
3. Add "Saved on device" indicator:
   - Create `src/ui/components/SavedIndicator.tsx`.
   - Reads `lastSavedAt` from store.
   - Displays "Saved on device" text (and optionally a relative timestamp like "just now").
4. Place the indicator in the sidebar footer.

## Tests Required

- Weekend columns receive the shading class.
- SavedIndicator renders when `lastSavedAt` is set.

## Definition of Done

- Weekend days have a subtle visual tint on the timeline.
- "Saved on device" indicator is visible.
- App feels polished on first load.
