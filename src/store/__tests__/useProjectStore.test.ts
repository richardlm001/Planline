import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../useProjectStore';

// Reset store and DB between tests
beforeEach(async () => {
  const { default: Dexie } = await import('dexie');
  await Dexie.delete('planline');
  useProjectStore.setState({
    tasks: [],
    dependencies: [],
    groups: [],
    project: { id: 'default', name: 'Project 01', epoch: '2024-01-01' },
    computedStarts: new Map(),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskId: null,
    lastSavedAt: null,
    isLoaded: false,
  });
});

describe('useProjectStore', () => {
  it('adding a task updates computedStarts', async () => {
    const task = await useProjectStore.getState().addTask({
      startDayIndex: 10,
      durationDays: 5,
    });

    const state = useProjectStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.computedStarts.get(task.id)).toBe(10);
  });

  it('adding a cyclic dependency sets scheduleError', async () => {
    const taskA = await useProjectStore.getState().addTask({ name: 'A', startDayIndex: 0 });
    const taskB = await useProjectStore.getState().addTask({ name: 'B', startDayIndex: 0 });

    // A → B
    const res1 = await useProjectStore.getState().addDependency(taskA.id, taskB.id);
    expect(res1.ok).toBe(true);

    // B → A (cycle)
    const res2 = await useProjectStore.getState().addDependency(taskB.id, taskA.id);
    expect(res2.ok).toBe(false);
    expect(res2.error).toContain('cycle');

    // The cyclic dependency should NOT have been persisted
    expect(useProjectStore.getState().dependencies).toHaveLength(1);
  });

  it('hydrate loads persisted data', async () => {
    // Add a task
    await useProjectStore.getState().addTask({ name: 'Persisted task', startDayIndex: 5, durationDays: 2 });
    expect(useProjectStore.getState().tasks).toHaveLength(1);

    // Reset store (simulate app reload)
    useProjectStore.setState({
      tasks: [],
      dependencies: [],
      groups: [],
      computedStarts: new Map(),
      isLoaded: false,
    });
    expect(useProjectStore.getState().tasks).toHaveLength(0);

    // Hydrate from DB
    await useProjectStore.getState().hydrate();
    const state = useProjectStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].name).toBe('Persisted task');
    expect(state.isLoaded).toBe(true);
  });
});
