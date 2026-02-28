import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { Sidebar } from '../Sidebar';

beforeEach(() => {
  useProjectStore.setState({
    tasks: [
      { id: 't1', name: 'Ungrouped', startDayIndex: 0, durationDays: 1, color: '#3B82F6', sortOrder: 0 },
      { id: 't2', name: 'Grouped A', startDayIndex: 0, durationDays: 1, color: '#10B981', sortOrder: 1, groupId: 'g1' },
      { id: 't3', name: 'Grouped B', startDayIndex: 0, durationDays: 1, color: '#F59E0B', sortOrder: 2, groupId: 'g1' },
    ],
    groups: [
      { id: 'g1', name: 'My Group', collapsed: false, sortOrder: 0 },
    ],
    dependencies: [],
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

describe('Task Groups', () => {
  it('renders group with children', () => {
    render(<Sidebar />);
    expect(screen.getByText('My Group')).toBeTruthy();
    expect(screen.getByText('Grouped A')).toBeTruthy();
    expect(screen.getByText('Grouped B')).toBeTruthy();
  });

  it('collapsing a group hides its children', () => {
    render(<Sidebar />);
    // Click the collapse toggle
    const toggle = screen.getByTestId('group-toggle-g1');
    fireEvent.click(toggle);

    // Children should be hidden
    expect(screen.queryByText('Grouped A')).toBeNull();
    expect(screen.queryByText('Grouped B')).toBeNull();
    // Group header should still be visible
    expect(screen.getByText('My Group')).toBeTruthy();
  });

  it('ungrouped tasks are still visible', () => {
    render(<Sidebar />);
    expect(screen.getByText('Ungrouped')).toBeTruthy();
  });
});
