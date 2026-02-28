import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { ZoomToggle } from '../ZoomToggle';

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
    zoomLevel: 'day',
    lastSavedAt: null,
    isLoaded: true,
    hydrationError: null,
    persistError: null,
  });
});

describe('ZoomToggle', () => {
  it('renders three zoom buttons', () => {
    render(<ZoomToggle />);
    expect(screen.getByTestId('zoom-day')).toBeTruthy();
    expect(screen.getByTestId('zoom-week')).toBeTruthy();
    expect(screen.getByTestId('zoom-month')).toBeTruthy();
  });

  it('day button is active by default', () => {
    render(<ZoomToggle />);
    const dayBtn = screen.getByTestId('zoom-day');
    expect(dayBtn.className).toContain('bg-blue-500');
  });

  it('clicking week button changes zoom level', () => {
    render(<ZoomToggle />);
    fireEvent.click(screen.getByTestId('zoom-week'));
    expect(useProjectStore.getState().zoomLevel).toBe('week');
  });

  it('clicking month button changes zoom level', () => {
    render(<ZoomToggle />);
    fireEvent.click(screen.getByTestId('zoom-month'));
    expect(useProjectStore.getState().zoomLevel).toBe('month');
  });

  it('active button gets highlighted style', () => {
    useProjectStore.setState({ zoomLevel: 'week' });
    render(<ZoomToggle />);
    const weekBtn = screen.getByTestId('zoom-week');
    const dayBtn = screen.getByTestId('zoom-day');
    expect(weekBtn.className).toContain('bg-blue-500');
    expect(dayBtn.className).not.toContain('bg-blue-500');
  });
});
