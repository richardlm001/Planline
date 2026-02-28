<div align="center">

# Planline

**Dead-simple, offline-first Gantt timeline planner.**

Drag and resize tasks on a clean timeline, link finish-to-start dependencies, and auto-shift downstream work — all in the browser, no backend required.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg)](https://tailwindcss.com/)

</div>

---

## Why Planline?

Most project planning tools are bloated, cloud-dependent, and need an account to get started. Planline is the opposite — a single-project Gantt chart that runs entirely in your browser. No sign-ups, no servers, no subscriptions. Just open it, plan your project, and get back to work.

## Features

- **Drag & drop timeline** — Move tasks horizontally, resize from either edge
- **Finish-to-start dependencies** — Draw arrows between tasks; downstream work auto-shifts
- **Cycle detection** — Circular dependencies are caught and rejected immediately
- **Keyboard-first navigation** — Arrow keys, Enter, Tab, Delete, F2 for fast workflows
- **Three zoom levels** — Day, Week, and Month views
- **Task groups** — Organize tasks into collapsible visual groups
- **Color-coded task bars** — Pick from a curated palette
- **Today line** — Always know where you are on the timeline
- **Weekend shading** — Visual distinction for non-working days
- **Offline-first** — All data saved to IndexedDB automatically, no network calls
- **Export / Import JSON** — Back up your data or move it between browsers
- **Inline editing** — Click to rename tasks and the project title

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/your-username/planline.git
cd planline
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

The output is a static site in `dist/` — deploy it anywhere (GitHub Pages, Netlify, Vercel, or just open `index.html`).

## Usage

| Action | How |
|--------|-----|
| **Add a task** | Click "Add Task" or press `Enter` |
| **Rename a task** | Click the task name in the sidebar, or select + `F2` |
| **Move a task** | Drag the bar horizontally on the timeline |
| **Resize a task** | Drag the left or right edge of the bar |
| **Create a dependency** | Drag from a task's right connector to another task's left connector |
| **Delete a task** | Select it, then press `Delete` or `Backspace` |
| **Navigate tasks** | `↑` / `↓` arrow keys |
| **Add dependent task** | Select a task, then press `Tab` |
| **Change zoom** | Toggle between Day / Week / Month in the timeline header |
| **Create a group** | "Add Group" button in the sidebar |
| **Export project** | Export JSON button in the sidebar |
| **Import project** | Import JSON button in the sidebar |

## Tech Stack

| Concern | Technology |
|---------|------------|
| Build | [Vite 7](https://vite.dev/) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org/) (strict mode) |
| UI | [React 19](https://react.dev/) — functional components only |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| State | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| Persistence | [Dexie 4](https://dexie.org/) (IndexedDB) |
| Date utilities | [date-fns 4](https://date-fns.org/) |
| IDs | [nanoid](https://github.com/ai/nanoid) |
| Testing | [Vitest 4](https://vitest.dev/) + Testing Library |

## Architecture

Planline follows a strict three-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │  React   │──▶│ Zustand  │──▶│  Dexie   │──▶ IndexedDB│
│  │   UI     │◀──│  Store   │   │   DB     │            │
│  └──────────┘   └────┬─────┘   └──────────┘            │
│                      │                                  │
│                 ┌────▼─────┐                            │
│                 │ Scheduler│  (pure functions)           │
│                 │ (domain) │                             │
│                 └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

- **Domain layer** (`src/domain/`) — Pure business logic: types, scheduling engine (Kahn's topological sort), constants. No IO or framework imports.
- **Persistence layer** (`src/db/`) — Dexie schema, repository pattern for CRUD, JSON export/import with validation.
- **UI layer** (`src/ui/`) — React components, hooks, and layout constants. Reads from and dispatches actions to the Zustand store.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full deep-dive.

## Project Structure

```
src/
  domain/          Pure logic — types, scheduler, constants
  db/              IndexedDB persistence — Dexie schema, repository, export/import
  store/           Zustand store — connects domain ↔ UI ↔ DB
  ui/
    components/    React components (Sidebar, Timeline, TaskBar, etc.)
    hooks/         Custom hooks (useKeyboardShortcuts)
    constants.ts   UI-level constants (zoom configs, row height)
  App.tsx          Root entrypoint
  main.tsx         Vite entrypoint
```

## Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Type check + build
npm run build

# Lint
npm run lint
```

### Testing

Tests use Vitest with jsdom and `fake-indexeddb` for full IndexedDB simulation — no mocking frameworks needed. Test files are colocated with source in `__tests__/` directories.

```bash
npm test
```

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm test`) and type checking (`npx tsc -b`)
5. Commit your changes (`git commit -m 'Add my feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Open a Pull Request

Please keep changes focused — one feature or fix per PR. See [AGENTS.md](AGENTS.md) for coding conventions and architecture rules.

## Roadmap

Planline currently covers single-project planning. Potential future additions include:

- Undo / redo
- Drag to reorder tasks in the sidebar
- Critical path highlighting
- Milestones
- Additional dependency types (Start-to-Start, etc.)
- Mobile-responsive layout

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with focus and simplicity in mind.</sub>
</div>
