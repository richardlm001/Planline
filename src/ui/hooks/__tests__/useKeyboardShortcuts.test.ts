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
    selectedTaskIds: ['a'],
    selectionAnchorId: 'a',
    selectedGroupId: null,
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
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['b']);
  });

  it('ArrowUp selects previous task', () => {
    useProjectStore.setState({ selectedTaskIds: ['b'], selectionAnchorId: 'b' });
    renderHook(() => useKeyboardShortcuts());
    act(() => fireKey('ArrowUp'));
    expect(useProjectStore.getState().selectedTaskIds).toEqual(['a']);
  });

  it('Delete removes the selected task', async () => {
    renderHook(() => useKeyboardShortcuts());
    await act(async () => {
      fireKey('Delete');
      await new Promise((r) => setTimeout(r, 50));
    });
    const state = useProjectStore.getState();
    expect(state.tasks.find((t) => t.id === 'a')).toBeUndefined();
    expect(state.selectedTaskIds).toHaveLength(0);
  });

  it('Escape deselects the current task', () => {
    renderHook(() => useKeyboardShortcuts());
    act(() => fireKey('Escape'));
    expect(useProjectStore.getState().selectedTaskIds).toHaveLength(0);
  });

  it('Shift+Enter creates a new group', async () => {
    renderHook(() => useKeyboardShortcuts());
    await act(async () => {
      fireKey('Enter', { shiftKey: true });
      await new Promise((r) => setTimeout(r, 50));
    });
    const state = useProjectStore.getState();
    // Should have a new group
    expect(state.groups.length).toBe(1);
    expect(state.groups[0].name).toBe('New group');
    // Tasks should remain unchanged
    expect(state.tasks.length).toBe(3);
    // sortOrder should be between task A (0) and task B (1)
    expect(state.groups[0].sortOrder).toBe(0.5);
    // Group should be selected and in editing mode
    expect(state.selectedGroupId).toBe(state.groups[0].id);
    expect(state.editingGroupId).toBe(state.groups[0].id);
  });

  it('Shift+Enter without selection appends group at end', async () => {
    useProjectStore.setState({ selectedTaskIds: [], selectionAnchorId: null });
    renderHook(() => useKeyboardShortcuts());
    await act(async () => {
      fireKey('Enter', { shiftKey: true });
      await new Promise((r) => setTimeout(r, 50));
    });
    const state = useProjectStore.getState();
    expect(state.groups.length).toBe(1);
    // No selected task → addGroup with default sortOrder (max + 1 = 0 since no groups exist)
    expect(state.groups[0].sortOrder).toBe(0);
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

  describe('group navigation', () => {
    beforeEach(() => {
      // Setup: ungrouped task 'a', then group 'g1' with tasks 'b' and 'c'
      useProjectStore.setState({
        tasks: [
          { id: 'a', name: 'Ungrouped', startDayIndex: 0, durationDays: 1, color: 'sky', sortOrder: 0 },
          { id: 'b', name: 'Grouped B', startDayIndex: 1, durationDays: 1, color: 'sky', sortOrder: 1, groupId: 'g1' },
          { id: 'c', name: 'Grouped C', startDayIndex: 2, durationDays: 1, color: 'sky', sortOrder: 2, groupId: 'g1' },
        ],
        groups: [
          { id: 'g1', name: 'Group 1', sortOrder: 0.5, collapsed: false },
        ],
        selectedTaskIds: ['a'],
        selectionAnchorId: 'a',
        selectedGroupId: null,
      });
    });

    it('ArrowDown from ungrouped task selects group header', () => {
      renderHook(() => useKeyboardShortcuts());
      act(() => fireKey('ArrowDown'));
      const state = useProjectStore.getState();
      expect(state.selectedGroupId).toBe('g1');
      expect(state.selectedTaskIds).toEqual([]);
    });

    it('ArrowDown from group header selects first child task', () => {
      useProjectStore.setState({ selectedTaskIds: [], selectedGroupId: 'g1' });
      renderHook(() => useKeyboardShortcuts());
      act(() => fireKey('ArrowDown'));
      const state = useProjectStore.getState();
      expect(state.selectedTaskIds).toEqual(['b']);
      expect(state.selectedGroupId).toBeNull();
    });

    it('ArrowUp from first child selects group header', () => {
      useProjectStore.setState({ selectedTaskIds: ['b'], selectionAnchorId: 'b', selectedGroupId: null });
      renderHook(() => useKeyboardShortcuts());
      act(() => fireKey('ArrowUp'));
      const state = useProjectStore.getState();
      expect(state.selectedGroupId).toBe('g1');
      expect(state.selectedTaskIds).toEqual([]);
    });

    it('ArrowDown skips collapsed group children', () => {
      useProjectStore.setState({
        groups: [{ id: 'g1', name: 'Group 1', sortOrder: 0.5, collapsed: true }],
        selectedTaskIds: ['a'],
        selectionAnchorId: 'a',
        selectedGroupId: null,
      });
      renderHook(() => useKeyboardShortcuts());
      act(() => fireKey('ArrowDown'));
      const state = useProjectStore.getState();
      // Should land on the group header (only visible item after 'a')
      expect(state.selectedGroupId).toBe('g1');
      expect(state.selectedTaskIds).toEqual([]);
      // Arrow down again should stay on group (no more items)
      act(() => fireKey('ArrowDown'));
      const state2 = useProjectStore.getState();
      expect(state2.selectedGroupId).toBe('g1');
    });

    it('ArrowDown with nothing selected picks first item', () => {
      useProjectStore.setState({ selectedTaskIds: [], selectedGroupId: null });
      renderHook(() => useKeyboardShortcuts());
      act(() => fireKey('ArrowDown'));
      const state = useProjectStore.getState();
      expect(state.selectedTaskIds).toEqual(['a']);
    });

    it('ArrowUp with nothing selected picks last item', () => {
      useProjectStore.setState({ selectedTaskIds: [], selectedGroupId: null });
      renderHook(() => useKeyboardShortcuts());
      act(() => fireKey('ArrowUp'));
      const state = useProjectStore.getState();
      expect(state.selectedTaskIds).toEqual(['c']);
    });

    it('Escape clears group selection', () => {
      useProjectStore.setState({ selectedTaskIds: [], selectedGroupId: 'g1' });
      renderHook(() => useKeyboardShortcuts());
      act(() => fireKey('Escape'));
      const state = useProjectStore.getState();
      expect(state.selectedGroupId).toBeNull();
      expect(state.selectedTaskIds).toEqual([]);
    });

    it('Enter on expanded group creates child task as last child', async () => {
      useProjectStore.setState({ selectedTaskIds: [], selectedGroupId: 'g1' });
      renderHook(() => useKeyboardShortcuts());
      await act(async () => {
        fireKey('Enter');
        await new Promise((r) => setTimeout(r, 50));
      });
      const state = useProjectStore.getState();
      // Should have 4 tasks now
      expect(state.tasks.length).toBe(4);
      const newTask = state.tasks.find((t) => t.name === 'New task');
      expect(newTask).toBeDefined();
      // Should be a child of the group
      expect(newTask!.groupId).toBe('g1');
      // sortOrder should be after the last child (c has sortOrder 2)
      expect(newTask!.sortOrder).toBe(3);
      // Should be selected and in editing mode
      expect(state.selectedTaskIds).toEqual([newTask!.id]);
      expect(state.editingTaskId).toBe(newTask!.id);
    });

    it('Enter on grouped child task creates sibling in same group', async () => {
      // Select task 'b' which is a child of group 'g1'
      useProjectStore.setState({ selectedTaskIds: ['b'], selectionAnchorId: 'b', selectedGroupId: null });
      renderHook(() => useKeyboardShortcuts());
      await act(async () => {
        fireKey('Enter');
        await new Promise((r) => setTimeout(r, 50));
      });
      const state = useProjectStore.getState();
      expect(state.tasks.length).toBe(4);
      const newTask = state.tasks.find((t) => t.name === 'New task');
      expect(newTask).toBeDefined();
      // Should be a child of the same group
      expect(newTask!.groupId).toBe('g1');
      // sortOrder should be between b (1) and c (2)
      expect(newTask!.sortOrder).toBe(1.5);
      // Should be selected and in editing mode
      expect(state.selectedTaskIds).toEqual([newTask!.id]);
      expect(state.editingTaskId).toBe(newTask!.id);
    });

    it('Enter on collapsed group creates ungrouped sibling below the group', async () => {
      useProjectStore.setState({
        groups: [{ id: 'g1', name: 'Group 1', sortOrder: 0.5, collapsed: true }],
        selectedTaskIds: [],
        selectedGroupId: 'g1',
      });
      renderHook(() => useKeyboardShortcuts());
      await act(async () => {
        fireKey('Enter');
        await new Promise((r) => setTimeout(r, 50));
      });
      const state = useProjectStore.getState();
      expect(state.tasks.length).toBe(4);
      const newTask = state.tasks.find((t) => t.name === 'New task');
      expect(newTask).toBeDefined();
      // Should NOT be a child of the group (ungrouped sibling)
      expect(newTask!.groupId).toBeUndefined();
      // The only top-level items are: task 'a' (sortOrder 0) and group 'g1' (sortOrder 0.5).
      // Group is the last top-level item, so nextOrder = 0.5 + 1 = 1.5
      // newSortOrder = (0.5 + 1.5) / 2 = 1
      expect(newTask!.sortOrder).toBe(1);
      // Group should remain collapsed
      const group = state.groups.find((g) => g.id === 'g1');
      expect(group!.collapsed).toBe(true);
      // Should be selected and in editing mode
      expect(state.selectedTaskIds).toEqual([newTask!.id]);
      expect(state.editingTaskId).toBe(newTask!.id);
    });
  });
});
