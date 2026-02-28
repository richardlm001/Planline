import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { SidebarTaskRow } from '../SidebarTaskRow';
import type { Task } from '../../../domain/types';

const testTask: Task = {
  id: 'test-1',
  name: 'My Task',
  startDayIndex: 0,
  durationDays: 3,
  color: '#3B82F6',
  sortOrder: 0,
};

beforeEach(() => {
  useProjectStore.setState({
    tasks: [testTask],
    dependencies: [],
    groups: [],
    computedStarts: new Map([['test-1', 0]]),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
  });
});

describe('SidebarTaskRow', () => {
  it('renders task name', () => {
    render(<SidebarTaskRow task={testTask} />);
    expect(screen.getByText('My Task')).toBeTruthy();
  });

  it('clicking selects the task', () => {
    render(<SidebarTaskRow task={testTask} />);
    fireEvent.click(screen.getByTestId('task-row-test-1'));
    expect(useProjectStore.getState().selectedTaskId).toBe('test-1');
  });

  it('double-clicking enters edit mode and saving updates the name', async () => {
    render(<SidebarTaskRow task={testTask} />);
    fireEvent.doubleClick(screen.getByTestId('task-row-test-1'));

    const input = screen.getByDisplayValue('My Task') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Renamed Task' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // The store should have been updated
    const state = useProjectStore.getState();
    expect(state.tasks[0].name).toBe('Renamed Task');
  });
});
