import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

function fireKey(key: string, opts?: Partial<KeyboardEventInit>) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
}

beforeEach(() => {
  useProjectStore.setState({
    tasks: [
      { id: 'a', name: 'A', startDayIndex: 0, durationDays: 2, color: '#3B82F6', sortOrder: 0 },
      { id: 'b', name: 'B', startDayIndex: 2, durationDays: 3, color: '#10B981', sortOrder: 1 },
      { id: 'c', name: 'C', startDayIndex: 5, durationDays: 1, color: '#F59E0B', sortOrder: 2 },
    ],
    dependencies: [],
    groups: [],
    computedStarts: new Map([['a', 0], ['b', 2], ['c', 5]]),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskId: 'a',
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
  });
});

describe('useKeyboardShortcuts', () => {
  it('ArrowDown selects next task', () => {
    renderHook(() => useKeyboardShortcuts());
    act(() => fireKey('ArrowDown'));
    expect(useProjectStore.getState().selectedTaskId).toBe('b');
  });

  it('ArrowUp selects previous task', () => {
    useProjectStore.setState({ selectedTaskId: 'b' });
    renderHook(() => useKeyboardShortcuts());
    act(() => fireKey('ArrowUp'));
    expect(useProjectStore.getState().selectedTaskId).toBe('a');
  });

  it('Delete removes the selected task', async () => {
    renderHook(() => useKeyboardShortcuts());
    await act(async () => {
      fireKey('Delete');
      await new Promise((r) => setTimeout(r, 50));
    });
    const state = useProjectStore.getState();
    expect(state.tasks.find((t) => t.id === 'a')).toBeUndefined();
    expect(state.selectedTaskId).toBeNull();
  });

  it('Escape deselects the current task', () => {
    renderHook(() => useKeyboardShortcuts());
    act(() => fireKey('Escape'));
    expect(useProjectStore.getState().selectedTaskId).toBeNull();
  });

  it('Tab creates a dependent task', async () => {
    renderHook(() => useKeyboardShortcuts());
    await act(async () => {
      fireKey('Tab');
      await new Promise((r) => setTimeout(r, 50));
    });
    const state = useProjectStore.getState();
    // Should have 4 tasks now
    expect(state.tasks.length).toBe(4);
    // Should have 1 dependency from 'a' to the new task
    expect(state.dependencies.length).toBe(1);
    expect(state.dependencies[0].fromTaskId).toBe('a');
  });
});
