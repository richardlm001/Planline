# T-001 — Project Scaffolding

**Status:** Backlog
**Size:** S

## Goal

Bootstrap the repository with Vite + React + TypeScript, install all dependencies, configure Tailwind CSS, Vitest, and establish the folder structure so subsequent tickets have a working dev environment.

## Non-Goals

- No application logic or UI components yet.
- No Dexie schema (that's T-002).

## UX Notes

N/A — infrastructure only.

## Data Model Impact

None.

## Implementation Steps

1. Initialize project with `npm create vite@latest . -- --template react-ts`.
2. Install dependencies:
   - `tailwindcss @tailwindcss/vite` (Tailwind v4)
   - `zustand`
   - `dexie`
   - `date-fns`
   - `vitest @testing-library/react @testing-library/jest-dom jsdom` (dev)
3. Configure Tailwind:
   - Add `@tailwindcss/vite` plugin to `vite.config.ts`.
   - Add `@import "tailwindcss"` to `src/index.css`.
4. Configure Vitest in `vite.config.ts` (jsdom environment).
5. Create folder structure:
   - `src/domain/` — scheduling logic (pure functions)
   - `src/db/` — Dexie schema + repository
   - `src/ui/` — React components
   - `src/ui/components/` — reusable pieces
6. Add a smoke-test component (`<App />` rendering "Planline") and verify `npm run dev` works.
7. Add a trivial Vitest test to confirm the test runner works.

## Tests Required

- One trivial test (e.g., `1 + 1 === 2`) to verify Vitest is configured.

## Definition of Done

- `npm run dev` starts the app and shows "Planline" in the browser.
- `npx vitest run` passes the smoke test.
- Folder structure exists: `src/domain/`, `src/db/`, `src/ui/`.
- All listed dependencies are in `package.json`.
