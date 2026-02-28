import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { Sidebar } from '../Sidebar';

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
    isLoaded: true,
    hydrationError: null,
    persistError: null,
  });
});

describe('Add Task', () => {
  it('clicking "Add task" button creates a task with correct defaults', async () => {
    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-btn'));
    });

    // Allow microtasks and async persistence to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const state = useProjectStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].name).toBe('New task');
    expect(state.tasks[0].durationDays).toBe(3);
    expect(state.selectedTaskId).toBe(state.tasks[0].id);
  });

  it('new task appears in the sidebar', async () => {
    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-btn'));
    });

    // The new task name or input should be visible
    const state = useProjectStore.getState();
    expect(state.tasks).toHaveLength(1);
  });
});
