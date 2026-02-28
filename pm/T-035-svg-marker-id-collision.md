# T-035: SVG Arrowhead Marker ID Collision Risk

**Priority:** Medium  
**Category:** Bug

## Problem

The `DependencyArrows` component uses a global SVG marker with `id="arrowhead"`. If multiple instances of the component were ever rendered (e.g., in a multi-project view, or during testing), the marker IDs would collide, causing arrows to reference the wrong marker or display incorrectly.

Even with a single instance, the generic `id="arrowhead"` could conflict with other SVG content on the page.

## Location

- [src/ui/components/DependencyArrows.tsx](../src/ui/components/DependencyArrows.tsx) — SVG marker definition

## Fix

Use a unique ID (e.g., `useId()` hook) or a prefixed constant like `planline-arrowhead`.

## Acceptance Criteria

- [ ] Arrowhead marker uses a unique or namespaced ID
- [ ] Arrows render correctly with the scoped marker
