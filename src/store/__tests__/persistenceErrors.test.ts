import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../useProjectStore';
import * as repo from '../../db/repository';

// Reset store between tests
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
  vi.restoreAllMocks();
});

describe('persistence error handling', () => {
  it('hydrate sets hydrationError on failure', async () => {
    vi.spyOn(repo, 'loadAll').mockRejectedValueOnce(new Error('DB corrupted'));

    await useProjectStore.getState().hydrate();

    const state = useProjectStore.getState();
    expect(state.isLoaded).toBe(true);
    expect(state.hydrationError).toBe('DB corrupted');
  });

  it('addTask sets persistError when save fails', async () => {
    vi.spyOn(repo, 'saveTask').mockRejectedValueOnce(new Error('Storage full'));

    await useProjectStore.getState().addTask({ name: 'Test' });

    const state = useProjectStore.getState();
    // Task was added optimistically
    expect(state.tasks).toHaveLength(1);
    expect(state.persistError).toBe('Storage full');
  });

  it('updateTask sets persistError when save fails', async () => {
    const task = await useProjectStore.getState().addTask({ name: 'Test' });
    vi.spyOn(repo, 'saveTask').mockRejectedValueOnce(new Error('Write error'));

    await useProjectStore.getState().updateTask(task.id, { name: 'Updated' });

    const state = useProjectStore.getState();
    expect(state.tasks[0].name).toBe('Updated'); // optimistic
    expect(state.persistError).toBe('Write error');
  });

  it('removeTask sets persistError when delete fails', async () => {
    const task = await useProjectStore.getState().addTask({ name: 'Test' });
    vi.spyOn(repo, 'deleteTask').mockRejectedValueOnce(new Error('Delete failed'));

    await useProjectStore.getState().removeTask(task.id);

    const state = useProjectStore.getState();
    expect(state.tasks).toHaveLength(0); // optimistic removal
    expect(state.persistError).toBe('Delete failed');
  });

  it('addDependency sets persistError when save fails', async () => {
    const taskA = await useProjectStore.getState().addTask({ name: 'A', startDayIndex: 0 });
    const taskB = await useProjectStore.getState().addTask({ name: 'B', startDayIndex: 5 });
    vi.spyOn(repo, 'saveDependency').mockRejectedValueOnce(new Error('Dep save error'));

    const result = await useProjectStore.getState().addDependency(taskA.id, taskB.id);

    expect(result.ok).toBe(true); // optimistic success
    const state = useProjectStore.getState();
    expect(state.persistError).toBe('Dep save error');
  });

  it('removeDependency sets persistError when delete fails', async () => {
    const taskA = await useProjectStore.getState().addTask({ name: 'A', startDayIndex: 0 });
    const taskB = await useProjectStore.getState().addTask({ name: 'B', startDayIndex: 5 });
    await useProjectStore.getState().addDependency(taskA.id, taskB.id);
    const depId = useProjectStore.getState().dependencies[0].id;

    vi.spyOn(repo, 'deleteDependency').mockRejectedValueOnce(new Error('Delete dep error'));

    await useProjectStore.getState().removeDependency(depId);

    const state = useProjectStore.getState();
    expect(state.dependencies).toHaveLength(0); // optimistic
    expect(state.persistError).toBe('Delete dep error');
  });

  it('updateProject sets persistError when save fails', async () => {
    vi.spyOn(repo, 'saveProject').mockRejectedValueOnce(new Error('Project save error'));

    await useProjectStore.getState().updateProject({ name: 'New Name' });

    const state = useProjectStore.getState();
    expect(state.project.name).toBe('New Name'); // optimistic
    expect(state.persistError).toBe('Project save error');
  });

  it('addGroup sets persistError when save fails', async () => {
    vi.spyOn(repo, 'saveGroup').mockRejectedValueOnce(new Error('Group save error'));

    await useProjectStore.getState().addGroup({ name: 'Test Group' });

    const state = useProjectStore.getState();
    expect(state.groups).toHaveLength(1); // optimistic
    expect(state.persistError).toBe('Group save error');
  });

  it('updateGroup sets persistError when save fails', async () => {
    const group = await useProjectStore.getState().addGroup({ name: 'Test Group' });
    vi.spyOn(repo, 'saveGroup').mockRejectedValueOnce(new Error('Group update error'));

    await useProjectStore.getState().updateGroup(group.id, { name: 'Renamed' });

    const state = useProjectStore.getState();
    expect(state.groups[0].name).toBe('Renamed'); // optimistic
    expect(state.persistError).toBe('Group update error');
  });

  it('removeGroup sets persistError when delete fails', async () => {
    const group = await useProjectStore.getState().addGroup({ name: 'Test Group' });
    vi.spyOn(repo, 'deleteGroup').mockRejectedValueOnce(new Error('Group delete error'));

    await useProjectStore.getState().removeGroup(group.id);

    const state = useProjectStore.getState();
    expect(state.groups).toHaveLength(0); // optimistic
    expect(state.persistError).toBe('Group delete error');
  });

  it('dismissError clears both error states', async () => {
    useProjectStore.setState({ persistError: 'some error', hydrationError: 'load error' });

    useProjectStore.getState().dismissError();

    const state = useProjectStore.getState();
    expect(state.persistError).toBeNull();
    expect(state.hydrationError).toBeNull();
  });
});
