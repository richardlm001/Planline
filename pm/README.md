# Planline — Project Management

## How We Work

This directory contains all planning artifacts for **Planline**, a minimal single-project timeline tool.

### Tickets

- Each ticket is a markdown file named `T-NNN-short-slug.md`.
- The index of all tickets lives in [TICKETS.md](TICKETS.md).
- MVP scope and non-goals are captured in [MVP_SCOPE.md](MVP_SCOPE.md).

### Ticket Lifecycle

| Status      | Meaning                                      |
| ----------- | -------------------------------------------- |
| `Backlog`   | Defined but not yet started                  |
| `In Progress` | Active work happening                      |
| `Done`      | All implementation steps + tests completed   |

### Definition of Done (global)

A ticket is **Done** when:

1. All implementation steps in the ticket are completed.
2. All tests listed in the ticket pass (`vitest run`).
3. The app builds without errors (`vite build`).
4. A short changelog section is appended to the ticket file.
5. The ticket status in `TICKETS.md` is updated to `Done`.

### Workflow

1. Pick a ticket from `TICKETS.md` (in recommended order).
2. Restate goal and DoD before starting.
3. Implement only what is scoped in that ticket.
4. Add/update tests as specified.
5. Mark ticket Done and append changelog.
6. If follow-up work is discovered, create a new ticket file and link it from `TICKETS.md`.
