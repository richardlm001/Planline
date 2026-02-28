# AGENTS.md — AI Agent Operating Guide

> How AI coding agents should work in this repository.

## Project Overview

**Planline** is a single-project, offline-first Gantt timeline tool built with React + TypeScript + Vite. It runs entirely in the browser with IndexedDB persistence (Dexie.js). There is no backend, no auth, no network calls.

## Repository Layout

```
src/
  domain/          Pure logic — types, scheduler, constants (no React, no IO)
  db/              IndexedDB persistence — Dexie schema, repository, export/import
  store/           Zustand store — single store connecting domain ↔ UI ↔ DB
  ui/
    components/    React components (Sidebar, Timeline, TaskBar, etc.)
    hooks/         Custom hooks (useKeyboardShortcuts)
    constants.ts   UI-level constants (zoom configs, row height, sidebar width)
  App.tsx          Root entrypoint (re-exports ui/App.tsx)
  main.tsx         Vite entrypoint (ReactDOM.createRoot)
pm/                Planning artifacts — tickets, MVP scope, workflow
```

## Tech Stack

| Concern          | Tool                                         |
|------------------|----------------------------------------------|
| Build            | Vite 7 + `@vitejs/plugin-react`              |
| Language         | TypeScript 5.9 (strict)                       |
| UI               | React 19, functional components only         |
| Styling          | Tailwind CSS v4 (Vite plugin, no config file) |
| State            | Zustand 5 (single store, no middleware)       |
| Persistence      | Dexie 4 (IndexedDB)                          |
| Dates            | date-fns 4                                    |
| IDs              | nanoid                                        |
| Testing          | Vitest 4 + @testing-library/react + jsdom     |
| Linting          | ESLint 9 flat config + typescript-eslint       |

## Architecture Rules

1. **Domain layer is pure.** `src/domain/` must never import React, Dexie, or any IO. It contains only types, pure functions, and constants.
2. **Single Zustand store.** All shared state flows through `useProjectStore`. Components access state via selector hooks — never prop-drill shared data.
3. **Repository pattern for DB.** Components and the store never import `db.ts` directly — they call functions in `repository.ts`.
4. **Scheduler runs synchronously in-store.** The `propagate()` function is called inside store actions whenever tasks or dependencies change. It returns computed start positions; components read `computedStarts` from the store.
5. **No class components.** Everything is functional components + hooks.
6. **One concern per file.** Each component lives in its own file. Hook files export a single hook.
7. **Sort order is explicit.** Tasks and groups carry a `sortOrder: number` field; the sidebar sorts by it.

## Coding Conventions

### TypeScript
- Use `interface` for data shapes, `type` for unions/aliases.
- Prefer `type` imports: `import type { Task } from './types'`.
- No `any` — use `unknown` and narrow.
- Use `as const` for constant objects.

### React
- `memo()` is used on expensive components (e.g., `TaskBar`). Apply it deliberately, not universally.
- Use `useCallback` for handlers passed as props or registered as event listeners.
- Use `useMemo` for derived data that is expensive to compute.
- Zustand selectors: `useProjectStore((s) => s.fieldName)` — one selector per value to minimize re-renders.

### Styling
- Tailwind utility classes only — no custom CSS files beyond `index.css` (which imports Tailwind).
- No CSS-in-JS, no CSS modules.

### Naming
- Components: `PascalCase` filenames and exports.
- Hooks: `camelCase` with `use` prefix.
- Test files: `__tests__/ComponentName.test.tsx` colocated with source.
- Domain functions: `camelCase` verbs (`propagate`, `getTaskEnd`, `dateToDayIndex`).

## Working with Tickets

All planned work lives in `pm/`. See `pm/README.md` for the full workflow.

- **Pick a ticket** from `pm/TICKETS.md` in recommended order.
- **Restate the goal and Definition of Done** before starting.
- **Implement only what is scoped** — do not add unscoped features.
- **Run `npm test`** after every change. All 47 tests must pass.
- **Run `npx tsc -b`** to verify the build compiles.
- **Mark the ticket Done** and append a changelog to the ticket file.
- If follow-up work is discovered, **create a new ticket** — never expand scope.

### Ticket file format

Each ticket is `pm/T-NNN-short-slug.md`. It contains: title, status, problem statement, implementation steps, tests required, and a changelog section appended on completion.

## Testing Rules

- **Test runner:** `npm test` (runs `vitest run`).
- **Environment:** jsdom with `fake-indexeddb` for IndexedDB simulation.
- **Setup:** `src/test-setup.ts` imports `@testing-library/jest-dom` globally.
- **Store tests:** Reset state with `useProjectStore.setState(...)` in `beforeEach`.
- **DB tests:** Delete and recreate the database in `beforeEach`.
- **No mocking frameworks.** Tests use real implementations with `fake-indexeddb`. Only mock what is absolutely necessary.
- **Colocated tests.** Test files live in `__tests__/` alongside their source — not in a top-level `test/` directory.
- **File naming:** `ComponentName.test.tsx` for components, `module.test.ts` for logic.

### What to test
- **Domain:** Pure function input/output. Cover happy paths, edge cases, error states.
- **Store:** Action side-effects on state. Verify computed fields update correctly.
- **Components:** Render output, user interactions (click, keyboard), conditional rendering.
- **DB/Export:** Round-trip persistence, validation edge cases.

## Commands

| Command            | Purpose                              |
|--------------------|--------------------------------------|
| `npm run dev`      | Start Vite dev server                |
| `npm run build`    | TypeScript check + Vite production build |
| `npm test`         | Run all tests (vitest run)           |
| `npm run lint`     | ESLint check                         |
| `npm run preview`  | Preview production build locally     |

## Known Issues (as of audit)

| Issue | Details |
|-------|---------|
| TS error in `db.test.ts` | Imports from `'../types'` instead of `'../../domain/types'` |
| Unused import in `TodayLine.tsx` | `useMemo` imported but not used |
| ESLint warning in `TaskBar.tsx` | Missing dependency `computedStart` in `useCallback` |
| Duplicate `useTodayIndex` hook | Defined locally in both `Timeline.tsx` and `TodayLine.tsx` |

## Do NOT

- Add a backend, API, or server.
- Add authentication or multi-user features.
- Install new dependencies without explicit approval.
- Use class components or HOCs.
- Write CSS outside of Tailwind utility classes.
- Modify the Dexie schema version without a migration plan.
- Skip running tests before marking work complete.
