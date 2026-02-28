# T-024: Import Data Validation is Insufficient

**Priority:** High  
**Category:** Bug / Security

## Problem

The `validateImportData()` function only performs shallow structural checks (arrays exist, project has `id` and `name`). It does **not** validate:

1. **Task shape**: Missing `id`, `name`, `startDayIndex`, `durationDays`, `color`, or `sortOrder` fields
2. **Dependency shape**: Missing `id`, `fromTaskId`, or `toTaskId` fields  
3. **Group shape**: Missing `id`, `name`, `collapsed`, or `sortOrder` fields
4. **Data types**: No check that `startDayIndex` is a number, `durationDays` > 0, etc.
5. **Referential integrity**: Dependencies may reference non-existent task IDs; tasks may reference non-existent group IDs
6. **Version field**: The `version` field is defined in the type but never checked during validation

Importing malformed data will silently corrupt the database, causing runtime crashes (e.g., `NaN` positions on the timeline, missing task names).

## Location

- [src/db/export.ts](../src/db/export.ts) — `validateImportData()` (line ~27)

## Expected Behavior

Validate all required fields for each entity type, including correct data types and reasonable value ranges. At minimum:

- Each task has `id: string`, `name: string`, `startDayIndex: number`, `durationDays: number > 0`, `color: string`, `sortOrder: number`
- Each dependency has `id: string`, `fromTaskId: string`, `toTaskId: string`
- Each group has `id: string`, `name: string`, `collapsed: boolean`, `sortOrder: number`
- `version` field is checked (currently always `1`)

## Acceptance Criteria

- [ ] All entity fields validated for existence and type
- [ ] `durationDays` validated as positive integer
- [ ] `version` field checked
- [ ] Invalid imports show a descriptive error message, not just "Invalid Planline JSON file"
- [ ] Unit tests for various malformed inputs
