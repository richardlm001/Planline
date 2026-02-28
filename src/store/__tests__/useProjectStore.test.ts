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
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: false,
    hydrationError: null,
    persistError: null,
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

  // --- Additional store action tests (T-037) ---

  it('updateTask updates name without rescheduling', async () => {
    const task = await useProjectStore.getState().addTask({ name: 'Original', startDayIndex: 5 });

    await useProjectStore.getState().updateTask(task.id, { name: 'Renamed' });

    const state = useProjectStore.getState();
    expect(state.tasks[0].name).toBe('Renamed');
    expect(state.lastSavedAt).toBeTruthy();
  });

  it('updateTask reschedules when durationDays changes', async () => {
    const taskA = await useProjectStore.getState().addTask({ name: 'A', startDayIndex: 0, durationDays: 3 });
    const taskB = await useProjectStore.getState().addTask({ name: 'B', startDayIndex: 5, durationDays: 2 });
    await useProjectStore.getState().addDependency(taskA.id, taskB.id);

    // B should be pushed to at least day 3 (A ends at 0+3)
    let state = useProjectStore.getState();
    expect(state.computedStarts.get(taskB.id)).toBeGreaterThanOrEqual(3);

    // Resize A to 5 days — B should now be at >= 5
    await useProjectStore.getState().updateTask(taskA.id, { durationDays: 5 });
    state = useProjectStore.getState();
    expect(state.computedStarts.get(taskB.id)).toBeGreaterThanOrEqual(5);
  });

  it('removeTask removes task and its dependencies', async () => {
    const taskA = await useProjectStore.getState().addTask({ name: 'A', startDayIndex: 0 });
    const taskB = await useProjectStore.getState().addTask({ name: 'B', startDayIndex: 5 });
    await useProjectStore.getState().addDependency(taskA.id, taskB.id);

    expect(useProjectStore.getState().tasks).toHaveLength(2);
    expect(useProjectStore.getState().dependencies).toHaveLength(1);

    await useProjectStore.getState().removeTask(taskA.id);

    const state = useProjectStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].id).toBe(taskB.id);
    expect(state.dependencies).toHaveLength(0);
  });

  it('removeTask deselects if the removed task was selected', async () => {
    const task = await useProjectStore.getState().addTask({ name: 'Test' });
    useProjectStore.getState().selectTask(task.id);
    expect(useProjectStore.getState().selectedTaskId).toBe(task.id);

    await useProjectStore.getState().removeTask(task.id);
    expect(useProjectStore.getState().selectedTaskId).toBeNull();
  });

  it('addDependency rejects self-dependency', async () => {
    const task = await useProjectStore.getState().addTask({ name: 'A' });
    const result = await useProjectStore.getState().addDependency(task.id, task.id);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('self');
  });

  it('addDependency rejects duplicate dependency', async () => {
    const taskA = await useProjectStore.getState().addTask({ name: 'A', startDayIndex: 0 });
    const taskB = await useProjectStore.getState().addTask({ name: 'B', startDayIndex: 5 });
    await useProjectStore.getState().addDependency(taskA.id, taskB.id);

    const result = await useProjectStore.getState().addDependency(taskA.id, taskB.id);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('exists');
  });

  it('removeDependency removes a dependency and reschedules', async () => {
    const taskA = await useProjectStore.getState().addTask({ name: 'A', startDayIndex: 0, durationDays: 3 });
    const taskB = await useProjectStore.getState().addTask({ name: 'B', startDayIndex: 1, durationDays: 2 });
    await useProjectStore.getState().addDependency(taskA.id, taskB.id);

    const depId = useProjectStore.getState().dependencies[0].id;
    await useProjectStore.getState().removeDependency(depId);

    const state = useProjectStore.getState();
    expect(state.dependencies).toHaveLength(0);
  });

  it('selectTask sets and clears selectedTaskId', () => {
    useProjectStore.getState().selectTask('some-id');
    expect(useProjectStore.getState().selectedTaskId).toBe('some-id');

    useProjectStore.getState().selectTask(null);
    expect(useProjectStore.getState().selectedTaskId).toBeNull();
  });

  it('updateProject updates project fields', async () => {
    await useProjectStore.getState().updateProject({ name: 'My Project' });

    const state = useProjectStore.getState();
    expect(state.project.name).toBe('My Project');
    expect(state.lastSavedAt).toBeTruthy();
  });

  it('addGroup creates a group with auto-incrementing sortOrder', async () => {
    const g1 = await useProjectStore.getState().addGroup({ name: 'Group 1' });
    const g2 = await useProjectStore.getState().addGroup({ name: 'Group 2' });

    expect(g1.sortOrder).toBe(0);
    expect(g2.sortOrder).toBe(1);
    expect(useProjectStore.getState().groups).toHaveLength(2);
  });

  it('updateGroup updates group name', async () => {
    const group = await useProjectStore.getState().addGroup({ name: 'Original' });

    await useProjectStore.getState().updateGroup(group.id, { name: 'Renamed' });

    const state = useProjectStore.getState();
    expect(state.groups[0].name).toBe('Renamed');
  });

  it('updateGroup toggles collapsed state', async () => {
    const group = await useProjectStore.getState().addGroup({ name: 'Test' });
    expect(group.collapsed).toBe(false);

    await useProjectStore.getState().updateGroup(group.id, { collapsed: true });
    expect(useProjectStore.getState().groups[0].collapsed).toBe(true);

    await useProjectStore.getState().updateGroup(group.id, { collapsed: false });
    expect(useProjectStore.getState().groups[0].collapsed).toBe(false);
  });

  it('removeGroup removes group and ungroups its tasks', async () => {
    const group = await useProjectStore.getState().addGroup({ name: 'My Group' });
    const task = await useProjectStore.getState().addTask({ name: 'Task', groupId: group.id });

    expect(useProjectStore.getState().tasks[0].groupId).toBe(group.id);

    await useProjectStore.getState().removeGroup(group.id);

    const state = useProjectStore.getState();
    expect(state.groups).toHaveLength(0);
    expect(state.tasks[0].groupId).toBeUndefined();
  });

  it('setEditingTaskId sets editing task', () => {
    useProjectStore.getState().setEditingTaskId('t1');
    expect(useProjectStore.getState().editingTaskId).toBe('t1');

    useProjectStore.getState().setEditingTaskId(null);
    expect(useProjectStore.getState().editingTaskId).toBeNull();
  });

  it('setLinkingFromTaskId sets linking state', () => {
    useProjectStore.getState().setLinkingFromTaskId('t1');
    expect(useProjectStore.getState().linkingFromTaskId).toBe('t1');

    useProjectStore.getState().setLinkingFromTaskId(null);
    expect(useProjectStore.getState().linkingFromTaskId).toBeNull();
  });

  it('setZoomLevel changes zoom', () => {
    useProjectStore.getState().setZoomLevel('week');
    expect(useProjectStore.getState().zoomLevel).toBe('week');

    useProjectStore.getState().setZoomLevel('month');
    expect(useProjectStore.getState().zoomLevel).toBe('month');

    useProjectStore.getState().setZoomLevel('day');
    expect(useProjectStore.getState().zoomLevel).toBe('day');
  });
});
