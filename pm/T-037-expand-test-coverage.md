# T-037: Expand Test Coverage for Core Paths

**Priority:** Medium  
**Category:** Testing

## Problem

Several critical components and modules have no or very thin test coverage:

### No tests at all:
1. **`DependencyArrows`** — Complex SVG rendering with row-index mapping
2. **`ExportImportButtons`** — File I/O with JSON validation
3. **`SidebarGroupRow`** — Collapse/expand, inline editing
4. **`Timeline`** — Zoom level switching, column generation, scrolling
5. **`TimelineBody`** — Task filtering, group collapse
6. **`ZoomToggle`** — Zoom level switching
7. **`repository.ts`** — All CRUD operations against IndexedDB

### Minimal tests (1 test case):
8. **`TaskBar.test.tsx`** — Only tests static positioning; missing: drag, resize, selection, dependency linking
9. **`TimelineHeader.test.tsx`** — Only tests day sublabels; missing: week/month headers, today highlighting
10. **`WeekendShading.test.tsx`** — Only tests CSS class; brittle selector

### Under-tested store:
11. **`useProjectStore.test.ts`** — Only 3 of ~15 store actions tested. Missing: `removeTask`, `updateTask`, `addGroup`, `updateGroup`, `removeGroup`, `selectTask`, `updateProject`

## Acceptance Criteria

- [ ] All components with user interaction have at least basic render + interaction tests
- [ ] Store actions have unit tests covering success and error paths
- [ ] Repository layer has integration tests with fake-indexeddb
- [ ] Overall test count increases from 44 to 80+
