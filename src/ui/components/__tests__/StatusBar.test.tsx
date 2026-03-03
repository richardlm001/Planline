import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { StatusBar } from '../StatusBar';

beforeEach(() => {
  useProjectStore.setState({
    tasks: [],
    dependencies: [],
    groups: [],
    project: { id: 'default', name: 'Project 01', epoch: '2024-01-01' },
    computedStarts: new Map(),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskIds: [],
    selectionAnchorId: null,
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
  });
});

describe('StatusBar', () => {
  it('shows "Not yet saved" when lastSavedAt is null', () => {
    render(<StatusBar />);
    expect(screen.getByText('Not yet saved')).toBeTruthy();
  });

  it('shows "Saved on device" when lastSavedAt is set', () => {
    useProjectStore.setState({ lastSavedAt: new Date() });
    render(<StatusBar />);
    expect(screen.getByText('Saved on device')).toBeTruthy();
  });

  it('shows always-visible shortcuts (Enter, Shift+Enter)', () => {
    render(<StatusBar />);
    expect(screen.getByText('New task')).toBeTruthy();
    expect(screen.getByText('New group')).toBeTruthy();
    expect(screen.getByText('Navigate')).toBeTruthy();
  });

  it('hides selection-dependent shortcuts when no task is selected', () => {
    render(<StatusBar />);
    expect(screen.queryByText('Rename')).toBeNull();
    expect(screen.queryByText('Add dependent')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('shows selection-dependent shortcuts when a task is selected', () => {
    useProjectStore.setState({
      selectedTaskIds: ['task-1'],
      tasks: [{ id: 'task-1', name: 'A', durationDays: 1, startDayIndex: 0, sortOrder: 0, color: 'sky' }],
    });
    render(<StatusBar />);
    expect(screen.getByText('Rename')).toBeTruthy();
    expect(screen.getByText('Add dependent')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('shows Delete shortcut when a group is selected', () => {
    useProjectStore.setState({
      selectedTaskIds: [],
      selectedGroupId: 'group-1',
      groups: [{ id: 'group-1', name: 'G', collapsed: false, sortOrder: 0 }],
    });
    render(<StatusBar />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });
});
