# T-017 — Task Groups (Visual)

**Status:** Backlog
**Size:** M

## Goal

Add visual-only task groups: collapsible labels in the sidebar with indented child tasks. Groups have no scheduling implications.

## Non-Goals

- Summary bars that span children.
- Drag to move tasks between groups.
- Group-level operations (delete group deletes children, etc.).

## UX Notes

- Groups appear as header rows in the sidebar with a collapse/expand chevron.
- Child tasks are indented ~20px under their group.
- Collapsed groups hide their children in both the sidebar and the timeline.
- Ungrouped tasks appear at the top level.
- Users can create a group via a "Add group" button or context action.
- A task can be assigned to a group (drag into group, or a simple dropdown — keep it minimal).

## Data Model Impact

Uses `Group` type and `task.groupId` from T-002.

## Implementation Steps

1. Add group CRUD actions to store (if not already from T-005).
2. Create `src/ui/components/SidebarGroupRow.tsx`:
   - Renders group name + collapse chevron.
   - Click chevron to toggle `collapsed`.
   - Inline rename similar to tasks.
3. Update `Sidebar.tsx` to render groups with their children nested.
4. Update timeline rendering: skip rows for collapsed group children.
5. Add "Add group" button in sidebar.
6. Allow assigning a task to a group: minimal UX (e.g., drag task row into group header, or a small "Move to group" action).

## Tests Required

- Collapsing a group hides its children in the list.
- Creating a group adds it to the store.
- Tasks with `groupId` render under their group.

## Definition of Done

- Groups can be created, renamed, and collapsed.
- Tasks render indented under their group.
- Collapsed groups hide children on both sidebar and timeline.
