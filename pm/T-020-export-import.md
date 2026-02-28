# T-020 — Export / Import JSON

**Status:** Backlog
**Size:** S

## Goal

Add "Export JSON" and "Import JSON" buttons so users can back up their project data and restore it.

## Non-Goals

- File format validation beyond basic structure.
- Merge with existing data (import replaces everything).
- Cloud sync.

## UX Notes

- Two small buttons in a toolbar area (top-right or sidebar footer).
- **Export**: downloads a `.json` file named `planline-{project-name}-{date}.json`.
- **Import**: opens a file picker. On selecting a valid file, replaces all project data.
- Show a brief confirmation or toast after import.
- Import is destructive — perhaps a simple "This will replace all current data. Continue?" confirm dialog.

## Data Model Impact

None. Serializes/deserializes existing data model.

## Implementation Steps

1. Create `src/db/export.ts`:
   - `exportProject(): object` — returns `{ project, tasks, dependencies, groups }` from the store/DB.
   - `importProject(data: object): void` — validates shape, clears existing data, writes new data to DB, rehydrates store.
2. Create `src/ui/components/ExportImportButtons.tsx`:
   - Export button: calls `exportProject()`, creates a Blob, triggers download via `<a>` click.
   - Import button: renders a hidden `<input type="file">`, parses JSON, calls `importProject()`.
3. Add basic schema validation (check for required keys).
4. Wire into toolbar/header area.

## Tests Required

- Export produces valid JSON with all data.
- Import restores data correctly.
- Import with invalid JSON shows an error.

## Definition of Done

- Users can export their project as a JSON file.
- Users can import a JSON file to restore data.
- Round-trip (export → import) preserves all data.
