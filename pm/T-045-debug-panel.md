# T-045 — Dev/QA Debug Panel (non-production only)

**Status:** Done
**Size:** M
**Category:** DX / Tooling

## Goal

Add a subtle "Debug" link at the bottom of the sidebar that is **only rendered in non-production builds** (`import.meta.env.DEV`). Clicking it opens a modal with developer/QA utilities for quickly manipulating app state without going through normal UI flows.

## Non-Goals

- Exposing debug features in production builds.
- Adding a backend or network-based tooling.
- Changing the Dexie schema or domain types.
- Building an elaborate settings/preferences system.

## Motivation

During development and QA, engineers need to:
- Quickly reset the app to a clean state without clearing browser data manually.
- Populate the timeline with realistic sample data at various scales to test rendering, performance, scrolling, and visual appearance.
- Inspect or tweak internal state without opening browser DevTools.

A dedicated debug panel keeps these utilities discoverable and out of the production bundle via Vite's dead-code elimination of `import.meta.env.DEV` blocks.

## Design

### Entry Point

- A small, muted text link ("Debug" or a 🛠 icon) pinned to the **bottom** of the `<Sidebar>`, below `<SavedIndicator>`.
- Rendered only when `import.meta.env.DEV === true`.
- Styled to be subtle: small font, muted gray, no background — not distracting during normal development.

### Debug Modal

A centered overlay modal with sections:

#### 1. Factory Reset
- **"Reset Everything"** button — clears all IndexedDB tables (`db.tasks`, `db.dependencies`, `db.groups`, `db.project`) and reloads the page (or re-hydrates the store).
- Confirmation prompt before executing (simple `window.confirm`).

#### 2. Prefill Sample Data
Three buttons to populate the app with realistic project data:

| Preset | Tasks | Groups | Dependencies | Description |
|--------|-------|--------|--------------|-------------|
| **Small** | ~8 | 2 | ~5 | A tiny team sprint — easy to visually verify |
| **Medium** | ~30 | 5 | ~20 | A realistic product project — tests scrolling and layout |
| **Large** | ~100 | 10 | ~60 | Stress-test — tests performance, long dependency chains, scrolling |

Each preset:
- Clears existing data first (with confirmation).
- Generates tasks with varied durations (1–15 days), realistic names (e.g., "Design mockups", "API integration", "QA regression"), assorted colors from `COLOR_PALETTE`, and proper `sortOrder`.
- Creates groups with descriptive names (e.g., "Design", "Backend", "Frontend", "QA", "DevOps").
- Adds Finish-to-Start dependencies forming realistic chains (no cycles).
- Sets the project name to match the preset (e.g., "Sample Project (Medium)").
- Runs scheduler propagation after insertion so tasks are positioned correctly.

#### 3. State Inspector
- Read-only display of key store metrics:
  - Task count, dependency count, group count.
  - Current zoom level.
  - Scheduler status (any cycle errors).
  - Selected task IDs.
- Useful for quick verification without opening React DevTools.

#### 4. Quick Actions
- **"Clear all dependencies"** — removes all dependencies, keeps tasks/groups.
- **"Collapse all groups"** / **"Expand all groups"** — bulk toggle.
- **"Randomize task colors"** — assigns random palette colors to all tasks.

### Modal UX

- Closeable via ✕ button, Escape key, or clicking the backdrop.
- Tailwind-styled, consistent with app's visual style.
- No external dependencies — uses existing Tailwind utilities and store actions.

## Implementation Steps

1. **Create `src/ui/components/debug/DebugButton.tsx`**
   - Renders a subtle "Debug" link.
   - Entire component wrapped in `if (!import.meta.env.DEV) return null`.
   - On click, opens the debug modal (local `useState`).

2. **Create `src/ui/components/debug/DebugModal.tsx`**
   - Modal overlay with backdrop.
   - Sections for each feature group (Reset, Prefill, Inspector, Quick Actions).
   - Close on Escape / backdrop click.

3. **Create `src/ui/components/debug/sampleData.ts`**
   - Pure functions: `generateSmallProject()`, `generateMediumProject()`, `generateLargeProject()`.
   - Each returns `{ tasks: Task[], groups: Group[], dependencies: Dependency[], project: Project }`.
   - Uses `nanoid` for IDs, `COLOR_PALETTE` for colors, `todayDayIndex()` as baseline for scheduling.
   - Task names drawn from a curated list of realistic software project tasks.
   - Dependencies form valid DAGs (no cycles).

4. **Create `src/ui/components/debug/debugActions.ts`**
   - `factoryReset()`: Clears all DB tables via `db.tasks.clear()`, `db.dependencies.clear()`, etc., then re-hydrates store.
   - `prefillData(preset: 'small' | 'medium' | 'large')`: Calls `factoryReset()`, generates sample data, bulk-inserts via `db.tasks.bulkPut()`, then re-hydrates store.
   - Helper actions for clear-dependencies, collapse/expand all, randomize colors.

5. **Add `<DebugButton />` to `Sidebar.tsx`**
   - Place it after `<SavedIndicator />` at the bottom of the sidebar flex column.

6. **Verify tree-shaking**
   - Run `npm run build` and confirm that the debug components are NOT present in the production bundle (Vite eliminates `import.meta.env.DEV` branches).

## File Structure

```
src/ui/components/debug/
  DebugButton.tsx      # Entry point — subtle link at sidebar bottom
  DebugModal.tsx       # Modal with all debug sections
  sampleData.ts        # Sample data generators (small/medium/large)
  debugActions.ts      # DB manipulation functions (reset, prefill, etc.)
```

## Tests Required

- **`sampleData.test.ts`**: Each generator returns valid data — correct number of tasks/groups, no duplicate IDs, no cyclic dependencies (run `propagate()` on output and assert `result.ok`), all task colors are from `COLOR_PALETTE`.
- **`debugActions.test.ts`**: `factoryReset()` clears all DB tables. `prefillData()` populates DB with expected counts.
- **`DebugButton.test.tsx`**: Component renders when `import.meta.env.DEV` is true. Clicking opens the modal.
- Production build does not include debug components (manual verification via `npm run build` + bundle inspection).

## Definition of Done

- Debug link visible in sidebar only during development.
- Factory reset clears all data and reloads state.
- All three prefill presets generate valid, schedulable project data.
- State inspector shows accurate live metrics.
- Quick actions work correctly.
- Debug code is tree-shaken from production builds.
- All new and existing tests pass (`npm test`).
- App builds without errors (`npm run build`).

## Changelog

**2026-02-28 — Completed**

### Files created
- `src/ui/components/debug/sampleData.ts` — Pure generators for small (8 tasks), medium (30), and large (100) sample projects with groups, dependencies, and realistic task names.
- `src/ui/components/debug/debugActions.ts` — Factory reset, prefill, clear dependencies, collapse/expand all groups, randomize colors.
- `src/ui/components/debug/DebugModal.tsx` — Modal with Factory Reset, Prefill Sample Data, State Inspector, and Quick Actions sections.
- `src/ui/components/debug/DebugButton.tsx` — Subtle sidebar entry point, only rendered when `import.meta.env.DEV`.
- `src/ui/components/debug/__tests__/sampleData.test.ts` — 3 tests validating generated data structure, palette colors, no cycles.
- `src/ui/components/debug/__tests__/debugActions.test.ts` — 4 tests for factory reset and all three prefill presets.
- `src/ui/components/debug/__tests__/DebugButton.test.tsx` — 4 tests for rendering, modal open/close, and state inspector metrics.

### Files modified
- `src/ui/components/Sidebar.tsx` — Added `<DebugButton />` import and placement after `<SavedIndicator />`.

### Test results
- 146 tests passing across 26 test files (11 new tests added).
- No new TypeScript errors introduced (pre-existing errors unchanged).

