# T-019 — Project Name (Inline Edit)

**Status:** Backlog
**Size:** S

## Goal

Display the project name at the top of the app and allow inline editing. Defaults to "Project 01".

## Non-Goals

- Multiple projects.
- Project settings beyond the name.

## UX Notes

- Project name displayed prominently at the top-center or top-left of the page.
- Click to edit (inline input, same pattern as task rename).
- Subtle styling — not too large, calm typography.

## Data Model Impact

Uses `Project.name` from T-002.

## Implementation Steps

1. Create `src/ui/components/ProjectHeader.tsx`:
   - Displays `project.name`.
   - Click or double-click to edit inline.
   - Enter to save, Escape to cancel.
   - Persist via `store.updateProject({ name })`.
2. Add to the top of `App.tsx`.
3. On first load (no project in DB), create a default project with name "Project 01".

## Tests Required

- Default project name is "Project 01".
- Editing and saving updates the name in the store.

## Definition of Done

- Project name is visible and editable at the top of the app.
- Name persists across refresh.
