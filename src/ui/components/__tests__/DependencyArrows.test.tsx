import { describe, it, expect, beforeEach } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { DependencyArrows } from '../DependencyArrows';
import { useProjectStore } from '../../../store/useProjectStore';

/** Return only visible arrow paths (not the transparent hit-area paths). */
const getVisiblePaths = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('path')).filter(
    (p) => p.getAttribute('stroke') !== 'transparent'
  );

beforeEach(() => {
  useProjectStore.setState({
    tasks: [],
    dependencies: [],
    groups: [],
    computedStarts: new Map(),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskIds: [],
    selectionAnchorId: null,
    selectedDependencyId: null,
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
    hydrationError: null,
    persistError: null,
  });
});

const dayToPixel = (dayIndex: number) => dayIndex * 40;
const defaultProps = {
  columnWidth: 40,
  rangeStartDayIndex: 0,
  pixelsPerDay: 40,
  dayToPixel,
};

describe('DependencyArrows', () => {
  it('renders a solid arrow for visible tasks', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
      ],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths.length).toBe(1);
    // Solid arrow should not have strokeDasharray
    expect(paths[0].getAttribute('stroke-dasharray')).toBeNull();
  });

  it('hides arrow when from-task is in a collapsed group', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0, groupId: 'g1' },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
      ],
      groups: [{ id: 'g1', name: 'Group 1', collapsed: true, sortOrder: 0 }],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths.length).toBe(0);
  });

  it('hides arrow when to-task is in a collapsed group', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1, groupId: 'g1' },
      ],
      groups: [{ id: 'g1', name: 'Group 1', collapsed: true, sortOrder: 0 }],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths.length).toBe(0);
  });

  it('renders solid arrow when group is expanded', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0, groupId: 'g1' },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
      ],
      groups: [{ id: 'g1', name: 'Group 1', collapsed: false, sortOrder: 0 }],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('stroke-dasharray')).toBeNull();
  });

  it('renders no arrow when both tasks are in the same collapsed group', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0, groupId: 'g1' },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1, groupId: 'g1' },
      ],
      groups: [{ id: 'g1', name: 'Group 1', collapsed: true, sortOrder: 0 }],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths.length).toBe(0);
  });

  it('renders no arrows when no dependencies exist', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
      ],
      dependencies: [],
      computedStarts: new Map([['t1', 0]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths.length).toBe(0);
  });

  it('arrow positions align with task bar row indices', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
        { id: 't3', name: 'C', startDayIndex: 10, durationDays: 1, color: '#F59E0B', sortOrder: 2 },
      ],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't3' }],
      computedStarts: new Map([['t1', 0], ['t2', 5], ['t3', 10]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths.length).toBe(1);
    const d = paths[0].getAttribute('d')!;
    // Row 0 center Y = 0 * 40 + 6 + 14 = 20
    // Row 2 center Y = 2 * 40 + 6 + 14 = 100
    expect(d).toContain('20');
    expect(d).toContain('100');
  });

  it('uses dragOverrides for arrow endpoints when present', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
      ],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    // Without overrides: arrow starts at dayToPixel(0 + 3) = 120
    const { container, rerender } = render(<DependencyArrows {...defaultProps} />);
    const pathsBefore = getVisiblePaths(container);
    const dBefore = pathsBefore[0].getAttribute('d')!;
    // sx = dayToPixel(0 + 3) = 120
    expect(dBefore).toContain('120');

    // Apply dragOverride: extend duration to 6
    act(() => {
      useProjectStore.setState({
        dragOverrides: new Map([['t1', { start: 0, durationDays: 6 }]]),
      });
    });

    rerender(<DependencyArrows {...defaultProps} />);
    const pathsAfter = getVisiblePaths(container);
    const dAfter = pathsAfter[0].getAttribute('d')!;
    // sx = dayToPixel(0 + 6) = 240
    expect(dAfter).toContain('240');
    // The old value should no longer appear as start x
    expect(dAfter).not.toMatch(/^M 120 /);
  });

  it('renders arrows with low opacity by default', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
      ],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths[0].getAttribute('stroke-opacity')).toBe('0.3');
  });

  it('selects a dependency when its arrow is clicked', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
      ],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
    });

    const { getByTestId } = render(<DependencyArrows {...defaultProps} />);
    const arrowGroup = getByTestId('dep-arrow-d1');
    fireEvent.click(arrowGroup);

    expect(useProjectStore.getState().selectedDependencyId).toBe('d1');
  });

  it('renders selected dependency with full opacity and highlight color', () => {
    useProjectStore.setState({
      tasks: [
        { id: 't1', name: 'A', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 },
        { id: 't2', name: 'B', startDayIndex: 5, durationDays: 2, color: '#10B981', sortOrder: 1 },
      ],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }],
      computedStarts: new Map([['t1', 0], ['t2', 5]]),
      selectedDependencyId: 'd1',
    });

    const { container } = render(<DependencyArrows {...defaultProps} />);
    const paths = getVisiblePaths(container);
    expect(paths[0].getAttribute('stroke-opacity')).toBe('1');
    expect(paths[0].getAttribute('stroke')).toBe('#3B82F6');
    expect(paths[0].getAttribute('stroke-width')).toBe('2');
  });
});
