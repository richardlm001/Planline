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
    groups: [
      { id: 'g1', name: 'Group 1', collapsed: false, sortOrder: 0 },
      { id: 'g2', name: 'Group 2', collapsed: false, sortOrder: 1 },
    ],
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

describe('moveTasksToPosition', () => {
  it('moves a task from root into a group', async () => {
    // Move task 'a' to position 1, assign to group g1
    await useProjectStore.getState().moveTasksToPosition(['a'], 1, 'g1');

    const state = useProjectStore.getState();
    const taskA = state.tasks.find((t) => t.id === 'a')!;
    expect(taskA.groupId).toBe('g1');
    expect(state.lastSavedAt).toBeTruthy();
  });

  it('moves a task out of a group (clears groupId)', async () => {
    // First put task 'a' into a group
    await useProjectStore.getState().moveTasksToPosition(['a'], 0, 'g1');
    expect(useProjectStore.getState().tasks.find((t) => t.id === 'a')!.groupId).toBe('g1');

    // Now move it out (no group)
    await useProjectStore.getState().moveTasksToPosition(['a'], 0, undefined);
    const taskA = useProjectStore.getState().tasks.find((t) => t.id === 'a')!;
    expect(taskA.groupId).toBeUndefined();
  });

  it('reorders a task between two other tasks', async () => {
    // Move 'd' to position 1 (between a and b)
    await useProjectStore.getState().moveTasksToPosition(['d'], 1);

    const state = useProjectStore.getState();
    const sorted = [...state.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted.map((t) => t.id)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('preserves relative order when moving multiple selected tasks', async () => {
    // Move a and c together to position after b
    await useProjectStore.getState().moveTasksToPosition(['a', 'c'], 1);

    const state = useProjectStore.getState();
    const sorted = [...state.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    // b remains at 0, then a, c (in their original relative order), then d
    expect(sorted.map((t) => t.id)).toEqual(['b', 'a', 'c', 'd']);
  });

  it('renormalizes sortOrder values after move', async () => {
    await useProjectStore.getState().moveTasksToPosition(['d'], 0);

    const state = useProjectStore.getState();
    const sorted = [...state.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    // sortOrder should be 0, 1, 2, 3
    expect(sorted.map((t) => t.sortOrder)).toEqual([0, 1, 2, 3]);
  });

  it('clamps targetIndex to valid range', async () => {
    // targetIndex beyond array length should clamp
    await useProjectStore.getState().moveTasksToPosition(['a'], 100);

    const state = useProjectStore.getState();
    const sorted = [...state.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    // 'a' should be at the end
    expect(sorted[sorted.length - 1].id).toBe('a');
  });

  it('moves tasks between groups', async () => {
    // Put 'a' in g1 first
    await useProjectStore.getState().moveTasksToPosition(['a'], 0, 'g1');
    // Now move 'a' from g1 to g2
    await useProjectStore.getState().moveTasksToPosition(['a'], 0, 'g2');

    const taskA = useProjectStore.getState().tasks.find((t) => t.id === 'a')!;
    expect(taskA.groupId).toBe('g2');
  });

  it('does not set persistError on success', async () => {
    await useProjectStore.getState().moveTasksToPosition(['a'], 2);
    expect(useProjectStore.getState().persistError).toBeNull();
  });
});
