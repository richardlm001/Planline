# TESTING_STRATEGY.md — Planline Testing Strategy

## 1. Overview

Planline uses **Vitest** with **jsdom** and **@testing-library/react** for all testing. Tests are colocated with source code in `__tests__/` directories. The project targets fast, deterministic tests that run without network access or real browser APIs.

### Current State (Audit Snapshot)

| Metric | Value |
|--------|-------|
| Test files | 16 |
| Test cases | 47 |
| Pass rate | 100% |
| Runtime | ~3.5s |
| Coverage tool | Not configured |

## 2. Toolchain

| Tool | Role |
|------|------|
| **Vitest 4** | Test runner, assertions, lifecycle hooks |
| **jsdom** | Browser environment simulation |
| **@testing-library/react** | Component rendering, queries, user events |
| **@testing-library/jest-dom** | DOM-specific matchers (`toBeInTheDocument`, `toHaveStyle`, etc.) |
| **fake-indexeddb** | In-memory IndexedDB implementation for Dexie tests |

### Configuration

- [vite.config.ts](vite.config.ts) — Test environment set to `jsdom`, globals enabled, setup file registered.
- [src/test-setup.ts](src/test-setup.ts) — Imports `@testing-library/jest-dom` to make DOM matchers globally available.

## 3. Test Categories

### 3.1 Domain Tests (`src/domain/__tests__/`)

**What:** Pure function input/output tests for the scheduling engine and utility functions.

**Pattern:**
```typescript
it('propagates finish-to-start', () => {
  const result = propagate(tasks, deps);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.starts.get('B')).toBe(expectedStart);
});
```

**Coverage targets:**
- `propagate()` — chain propagation, multiple predecessors, unconnected tasks, cycle detection (simple cycle, subset cycle, no false positives)
- `getTaskEnd()` — basic arithmetic
- `dateToDayIndex()` / `dayIndexToDate()` — epoch conversion

**Guidelines:**
- No mocks. These are pure functions — test with real data.
- Use descriptive task names/IDs in test fixtures for readability.
- Always test both the `ok: true` and `ok: false` branches of `ScheduleResult`.

### 3.2 Store Tests (`src/store/__tests__/`)

**What:** Zustand store action tests — verify that actions update state correctly and that computed fields (scheduler output) stay in sync.

**Pattern:**
```typescript
beforeEach(async () => {
  await db.delete();
  await db.open();
  useProjectStore.setState({ ...initialState });
});

it('addTask updates computedStarts', async () => {
  const task = await useProjectStore.getState().addTask();
  const starts = useProjectStore.getState().computedStarts;
  expect(starts.get(task.id)).toBeDefined();
});
```

**Coverage targets:**
- `addTask` — default values, computed starts updated
- `updateTask` — scheduling fields trigger reschedule, cosmetic fields do not
- `removeTask` — task removed, related dependencies cleaned up
- `addDependency` — success case, self-dependency rejection, duplicate rejection, cycle rejection
- `removeDependency` — dependency removed, schedule recomputed
- `addGroup` / `updateGroup` / `removeGroup` — group CRUD, orphaned task handling
- `hydrate` — round-trip through IndexedDB

**Guidelines:**
- Reset store state AND database in `beforeEach`.
- Use `import 'fake-indexeddb/auto'` at the top of the file.
- Call actions via `useProjectStore.getState().actionName()`.
- Verify both the state change and the side effect (persistence).

### 3.3 Component Tests (`src/ui/components/__tests__/`)

**What:** Render tests using @testing-library/react. Verify that components render correctly and respond to user interactions.

**Pattern:**
```typescript
beforeEach(() => {
  useProjectStore.setState({ ...stateWithTasks });
});

it('renders task name', () => {
  render(<SidebarTaskRow task={mockTask} />);
  expect(screen.getByText('My Task')).toBeInTheDocument();
});
```

**Coverage targets:**
- Render output matches expected DOM (text content, attributes, styles)
- User interactions: click, double-click, keydown, pointer events
- Conditional rendering: loading states, empty states, collapsed groups
- Inline editing: focus management, save on Enter, cancel on Escape

**Guidelines:**
- Set store state in `beforeEach` to establish test context.
- Query by accessible roles and text content, not by CSS classes or test IDs.
- Use `fireEvent` for simple events; `userEvent` if interaction sequencing matters.
- Do NOT test implementation details (internal state, private methods).

### 3.4 DB / Export Tests (`src/db/__tests__/`)

**What:** Persistence round-trip tests and import validation tests.

**Pattern:**
```typescript
beforeEach(async () => {
  await db.delete();
  await db.open();
});

it('persists and retrieves a task', async () => {
  await repo.saveTask(task);
  const loaded = await repo.loadAll();
  expect(loaded.tasks).toContainEqual(task);
});
```

**Coverage targets:**
- `repository.ts` — CRUD round-trips for each entity type
- `export.ts` — `buildExportData()` output shape, `validateImportData()` with valid/invalid inputs, `importProject()` atomicity
- Validation edge cases: missing fields, wrong types, broken referential integrity, zero/negative durations, dangling dependency references

**Guidelines:**
- Always `db.delete()` + `db.open()` in `beforeEach` for clean state.
- Import `fake-indexeddb/auto` before any Dexie imports.
- Test validation exhaustively — it's the import safety gate.

### 3.5 Hook Tests (`src/ui/hooks/__tests__/`)

**What:** Custom hook behavior tests using `renderHook()`.

**Pattern:**
```typescript
it('ArrowDown selects next task', () => {
  useProjectStore.setState({ ...stateWithTasks, selectedTaskId: 'task-1' });
  renderHook(() => useKeyboardShortcuts());
  fireEvent.keyDown(window, { key: 'ArrowDown' });
  expect(useProjectStore.getState().selectedTaskId).toBe('task-2');
});
```

**Guidelines:**
- Use `renderHook()` from @testing-library/react.
- Simulate keyboard events on `window` for global handlers.
- Verify store state changes, not internal hook state.

## 4. Test Organization

### File Naming

```
src/
  domain/
    scheduler.ts
    __tests__/
      scheduler.test.ts        ← domain tests (plain .ts)
  db/
    repository.ts
    __tests__/
      db.test.ts               ← DB tests (plain .ts)
      export.test.ts
  store/
    useProjectStore.ts
    __tests__/
      useProjectStore.test.ts  ← store tests (plain .ts)
  ui/
    components/
      TaskBar.tsx
      __tests__/
        TaskBar.test.tsx       ← component tests (.tsx)
    hooks/
      useKeyboardShortcuts.ts
      __tests__/
        useKeyboardShortcuts.test.ts
```

**Conventions:**
- Test files mirror source file names with `.test.ts(x)` suffix.
- Use `.tsx` extension only when tests render JSX.
- One test file per source file.

### Test Structure

```typescript
import 'fake-indexeddb/auto';  // if DB is involved
import { describe, it, expect, beforeEach } from 'vitest';

describe('ModuleName', () => {
  beforeEach(() => {
    // Reset state
  });

  describe('featureOrMethod', () => {
    it('does expected thing in normal case', () => { ... });
    it('handles edge case', () => { ... });
    it('rejects invalid input', () => { ... });
  });
});
```

## 5. Coverage Gaps (from audit)

### Untested Components

| Component | Priority | Reason |
|-----------|----------|--------|
| `DependencyArrows` | Medium | SVG rendering logic, collapsed-group filtering |
| `ExportImportButtons` | Medium | File I/O interaction, Blob creation |
| `SidebarGroupRow` | Low | Similar to SidebarTaskRow (already tested) |
| `ZoomToggle` | Low | Simple toggle, minimal logic |
| `TimelineBody` | Medium | Filters collapsed groups, renders task list |
| `Timeline` | High | Complex scroll-to-today logic, zoom integration |
| `App.tsx` | Low | Thin shell, mostly layout |

### Untested Store Actions

| Action | Priority |
|--------|----------|
| `updateTask` (scheduling vs cosmetic paths) | High |
| `removeTask` (dependency cleanup) | High |
| `removeGroup` (task orphaning) | Medium |
| `addGroup`, `updateGroup` | Low |
| `updateProject` | Low |

### Untested Interactions

| Interaction | Priority |
|-------------|----------|
| Drag-to-move (TaskBar pointer events) | High |
| Resize (left/right edge handles) | High |
| Dependency connector drag | High |
| Scroll-to-today on load | Medium |
| Zoom level switching | Low |

## 6. Testing Principles

1. **Test behavior, not implementation.** Assert what the user sees or what the API returns — not internal variable values.
2. **Prefer integration over isolation.** Store tests use the real scheduler. DB tests use real (fake) IndexedDB. Only mock when the real thing is impractical.
3. **Each test is independent.** No test should depend on another test's side effects. Reset all shared state in `beforeEach`.
4. **Fast by default.** All tests run in < 5 seconds. No network calls, no file I/O, no timers (unless explicitly testing time-dependent behavior).
5. **Deterministic.** Tests must not depend on wall-clock time. When testing `todayDayIndex()`, either mock `Date` or assert relative values.
6. **Readable fixtures.** Use descriptive names in test data: `{ id: 'design', name: 'Design phase' }` over `{ id: 'a', name: 'x' }`.

## 7. Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (during development)
npx vitest

# Run a specific test file
npx vitest src/domain/__tests__/scheduler.test.ts

# Run tests matching a pattern
npx vitest --reporter=verbose -t "cycle"

# Run with coverage (requires config addition)
npx vitest --coverage
```

## 8. Adding New Tests

When adding a new feature or fixing a bug:

1. **Identify the layer.** Is it domain logic, store behavior, UI rendering, or persistence?
2. **Create or extend the test file** in the appropriate `__tests__/` directory.
3. **Write the failing test first** (if doing TDD).
4. **Follow the patterns** in existing test files for that layer.
5. **Run `npm test`** to verify all tests pass (including existing ones).
6. **Check for flakiness** — run twice to ensure determinism.

### Test Checklist for New Features

- [ ] Happy path works
- [ ] Edge cases handled (empty input, boundary values, max/min)
- [ ] Error states produce correct error messages
- [ ] State is cleaned up properly (no leaked side effects)
- [ ] Scheduler recomputes when relevant fields change
- [ ] Persistence round-trip works (if applicable)

## 9. Future Improvements

| Improvement | Effort | Impact |
|-------------|--------|--------|
| Add Vitest coverage reporting (`v8` or `istanbul` provider) | Low | Visibility into actual coverage % |
| Test drag/resize interactions with pointer event simulation | Medium | Covers the most complex UI logic |
| Add `DependencyArrows` render tests | Medium | Validates SVG path generation |
| Integration test: full add-task → drag → add-dependency flow | High | End-to-end confidence |
| Snapshot tests for timeline rendering at different zoom levels | Low | Regression detection |
| Performance benchmarks for scheduler with large task sets | Low | Prevent regression as data grows |
