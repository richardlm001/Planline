import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { DependencyArrows } from '../DependencyArrows';
import { useProjectStore } from '../../../store/useProjectStore';

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
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(1);
    // Solid arrow should not have strokeDasharray
    expect(paths[0].getAttribute('stroke-dasharray')).toBeNull();
  });

  it('renders a dashed arrow when from-task is in a collapsed group', () => {
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
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(1);
    // Collapsed arrow should have dashed style
    expect(paths[0].getAttribute('stroke-dasharray')).toBe('4 3');
  });

  it('renders a dashed arrow when to-task is in a collapsed group', () => {
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
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('stroke-dasharray')).toBe('4 3');
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
    const paths = container.querySelectorAll('path');
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
    const paths = container.querySelectorAll('path');
    // Both tasks collapsed to same group position — arrow still renders (dashed)
    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('stroke-dasharray')).toBe('4 3');
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
    const paths = container.querySelectorAll('path');
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
    const path = container.querySelector('path');
    expect(path).toBeTruthy();
    const d = path!.getAttribute('d')!;
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
    const pathBefore = container.querySelector('path')!;
    const dBefore = pathBefore.getAttribute('d')!;
    // sx = dayToPixel(0 + 3) = 120
    expect(dBefore).toContain('120');

    // Apply dragOverride: extend duration to 6
    act(() => {
      useProjectStore.setState({
        dragOverrides: new Map([['t1', { start: 0, durationDays: 6 }]]),
      });
    });

    rerender(<DependencyArrows {...defaultProps} />);
    const pathAfter = container.querySelector('path')!;
    const dAfter = pathAfter.getAttribute('d')!;
    // sx = dayToPixel(0 + 6) = 240
    expect(dAfter).toContain('240');
    // The old value should no longer appear as start x
    expect(dAfter).not.toMatch(/^M 120 /);
  });
});
