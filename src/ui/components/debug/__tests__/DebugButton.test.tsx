import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../../store/useProjectStore';
import { DebugButton } from '../DebugButton';

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
    hydrationError: null,
    persistError: null,
  });
});

describe('DebugButton', () => {
  it('renders the debug button in dev mode', () => {
    render(<DebugButton />);
    expect(screen.getByTestId('debug-open-btn')).toBeTruthy();
  });

  it('opens the debug modal on click', () => {
    render(<DebugButton />);
    fireEvent.click(screen.getByTestId('debug-open-btn'));
    expect(screen.getByTestId('debug-modal-backdrop')).toBeTruthy();
    expect(screen.getByText('Debug Panel')).toBeTruthy();
  });

  it('closes the modal when close button is clicked', () => {
    render(<DebugButton />);
    fireEvent.click(screen.getByTestId('debug-open-btn'));
    expect(screen.getByTestId('debug-modal-backdrop')).toBeTruthy();

    fireEvent.click(screen.getByTestId('debug-modal-close'));
    expect(screen.queryByTestId('debug-modal-backdrop')).toBeNull();
  });

  it('displays state inspector metrics', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 1, color: '#C8D9FA', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 0, durationDays: 1, color: '#C8D9FA', sortOrder: 1 },
      ],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      groups: [{ id: 'g1', name: 'G', collapsed: false, sortOrder: 0 }],
    });

    render(<DebugButton />);
    fireEvent.click(screen.getByTestId('debug-open-btn'));

    expect(screen.getByTestId('debug-task-count').textContent).toBe('2');
    expect(screen.getByTestId('debug-dep-count').textContent).toBe('1');
    expect(screen.getByTestId('debug-group-count').textContent).toBe('1');
  });
});
