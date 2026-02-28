import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../useProjectStore';

beforeEach(async () => {
  const { default: Dexie } = await import('dexie');
  await Dexie.delete('planline');
  useProjectStore.setState({
    tasks: [
      { id: 'a', name: 'A', startDayIndex: 0, durationDays: 2, color: '#3B82F6', sortOrder: 0 },
      { id: 'b', name: 'B', startDayIndex: 2, durationDays: 3, color: '#10B981', sortOrder: 1 },
      { id: 'c', name: 'C', startDayIndex: 5, durationDays: 1, color: '#F59E0B', sortOrder: 2 },
      { id: 'd', name: 'D', startDayIndex: 6, durationDays: 2, color: '#EF4444', sortOrder: 3 },
    ],
    dependencies: [],
    groups: [],
    project: { id: 'default', name: 'Project 01', epoch: '2024-01-01' },
    computedStarts: new Map([['a', 0], ['b', 2], ['c', 5], ['d', 6]]),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskIds: [],
    selectionAnchorId: null,
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
    hydrationError: null,
    persistError: null,
  });
});

describe('multi-select tasks', () => {
  it('plain click selects one task and deselects others', () => {
    useProjectStore.getState().selectTask('a');
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['a']);
    expect(useProjectStore.getState().selectionAnchorId).toBe('a');

    useProjectStore.getState().selectTask('b');
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['b']);
    expect(useProjectStore.getState().selectionAnchorId).toBe('b');
  });

  it('Cmd/Ctrl+click toggles a task without affecting others', () => {
    useProjectStore.getState().selectTask('a');
    useProjectStore.getState().selectTask('c', { meta: true });

    expect(useProjectStore.getState().selectedTaskIds).toEqual(['a', 'c']);

    // Toggle c off
    useProjectStore.getState().selectTask('c', { meta: true });
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['a']);

    // Toggle b on
    useProjectStore.getState().selectTask('b', { meta: true });
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['a', 'b']);
  });

  it('Shift+click selects a contiguous range', () => {
    // Set anchor at 'a'
    useProjectStore.getState().selectTask('a');
    expect(useProjectStore.getState().selectionAnchorId).toBe('a');

    // Shift+click on 'c' should select a, b, c
    useProjectStore.getState().selectTask('c', { shift: true });
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['a', 'b', 'c']);
  });

  it('Shift+click selects range in reverse direction', () => {
    useProjectStore.getState().selectTask('d');
    useProjectStore.getState().selectTask('b', { shift: true });
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['b', 'c', 'd']);
  });

  it('Shift+click with no anchor falls back to selecting one task', () => {
    // No prior selection → selectionAnchorId is null
    useProjectStore.getState().selectTask('c', { shift: true });
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['c']);
  });

  it('selectTask(null) clears selection', () => {
    useProjectStore.getState().selectTask('a');
    useProjectStore.getState().selectTask('b', { meta: true });
    expect(useProjectStore.getState().selectedTaskIds).toHaveLength(2);

    useProjectStore.getState().selectTask(null);
    expect(useProjectStore.getState().selectedTaskIds).toHaveLength(0);
    expect(useProjectStore.getState().selectionAnchorId).toBeNull();
  });

  it('clearSelection clears selection', () => {
    useProjectStore.getState().selectTask('a');
    useProjectStore.getState().selectTask('b', { meta: true });

    useProjectStore.getState().clearSelection();
    expect(useProjectStore.getState().selectedTaskIds).toHaveLength(0);
    expect(useProjectStore.getState().selectionAnchorId).toBeNull();
  });

  it('delete removes all selected tasks', async () => {
    useProjectStore.getState().selectTask('a');
    useProjectStore.getState().selectTask('c', { meta: true });

    // Remove both selected tasks
    const ids = [...useProjectStore.getState().selectedTaskIds];
    for (const id of ids) {
      await useProjectStore.getState().removeTask(id);
    }

    const state = useProjectStore.getState();
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks.map((t) => t.id)).toEqual(['b', 'd']);
  });

  it('removeTask removes deleted task from selectedTaskIds', async () => {
    useProjectStore.getState().selectTask('a');
    useProjectStore.getState().selectTask('b', { meta: true });
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['a', 'b']);

    await useProjectStore.getState().removeTask('a');
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['b']);
  });
});
