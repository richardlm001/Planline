import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { TaskBar, snapToHalfDay } from '../TaskBar';
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

const defaultTask = {
  id: 't1',
  name: 'Test Task',
  startDayIndex: 0,
  durationDays: 3,
  color: '#3B82F6',
  sortOrder: 0,
};

const dayToPixel = (dayIndex: number) => dayIndex * 40;
const defaultProps = {
  task: defaultTask,
  computedStart: 5,
  columnWidth: 40,
  rowIndex: 0,
  rangeStartDayIndex: 0,
  pixelsPerDay: 40,
  dayToPixel,
  totalRows: 3,
  onVerticalDrop: () => {},
};

describe('TaskBar', () => {
  it('renders with correct left/width style', () => {
    const { container } = render(<TaskBar {...defaultProps} />);

    const bar = container.firstElementChild as HTMLElement;
    expect(bar.style.left).toBe('200px'); // 5 * 40
    expect(bar.style.width).toBe('120px'); // 3 * 40
    expect(bar.textContent).toBe('Test Task');
  });

  it('renders at the correct row offset', () => {
    const { container } = render(<TaskBar {...defaultProps} rowIndex={2} />);
    const bar = container.firstElementChild as HTMLElement;
    // top = rowIndex * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2 = 2 * 40 + 6 = 86
    expect(bar.style.top).toBe('86px');
  });

  it('applies selected styling when task is selected', () => {
    useProjectStore.setState({ selectedTaskIds: ['t1'], selectionAnchorId: 't1' });
    const { container } = render(<TaskBar {...defaultProps} />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('ring-2');
    expect(bar.className).toContain('border-blue-500');
  });

  it('does not apply selected styling when another task is selected', () => {
    useProjectStore.setState({ selectedTaskIds: ['other'], selectionAnchorId: 'other' });
    const { container } = render(<TaskBar {...defaultProps} />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).not.toContain('ring-2');
  });

  it('clicking selects the task', () => {
    useProjectStore.setState({ tasks: [defaultTask] });
    const { getByTestId } = render(<TaskBar {...defaultProps} />);
    const bar = getByTestId('task-bar-t1');
    // Mock setPointerCapture since jsdom doesn't support it
    bar.setPointerCapture = () => {};
    bar.releasePointerCapture = () => {};
    fireEvent.pointerDown(bar, { clientX: 100, pointerId: 1 });
    expect(useProjectStore.getState().selectedTaskIds).toContain('t1');
  });

  it('renders input and output connectors', () => {
    const { getByTestId } = render(<TaskBar {...defaultProps} />);
    expect(getByTestId('connector-in-t1')).toBeTruthy();
    expect(getByTestId('connector-out-t1')).toBeTruthy();
  });

  it('shows task color as background', () => {
    const { container } = render(<TaskBar {...defaultProps} />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.style.backgroundColor).toBe('color-mix(in srgb, rgb(59, 130, 246) 45%, white)');
  });

  it('uses computedStart for positioning rather than task.startDayIndex', () => {
    const { container } = render(
      <TaskBar {...defaultProps} computedStart={10} />
    );
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.style.left).toBe('400px'); // 10 * 40
  });

  it('stops click event propagation so canvas deselect does not fire', () => {
    useProjectStore.setState({ tasks: [defaultTask], selectedTaskIds: ['t1'], selectionAnchorId: 't1' });
    const parentClickSpy = { called: false };
    const { getByTestId } = render(
      <div onClick={() => { parentClickSpy.called = true; }}>
        <TaskBar {...defaultProps} />
      </div>
    );
    const bar = getByTestId('task-bar-t1');
    fireEvent.click(bar);
    expect(parentClickSpy.called).toBe(false);
  });
});

describe('snapToHalfDay', () => {
  it('snaps to nearest whole day when closer to integer', () => {
    expect(snapToHalfDay(2.1)).toBe(2);
    expect(snapToHalfDay(2.9)).toBe(3);
    expect(snapToHalfDay(-1.2)).toBe(-1);
  });

  it('snaps to nearest half day when closer to .5', () => {
    expect(snapToHalfDay(2.3)).toBe(2.5);
    expect(snapToHalfDay(2.7)).toBe(2.5);
    expect(snapToHalfDay(0.6)).toBe(0.5);
  });

  it('returns exact value for already-snapped values', () => {
    expect(snapToHalfDay(0)).toBe(0);
    expect(snapToHalfDay(0.5)).toBe(0.5);
    expect(snapToHalfDay(1)).toBe(1);
    expect(snapToHalfDay(3.5)).toBe(3.5);
  });

  it('handles the 0.25 boundary (rounds to 0.5)', () => {
    // Math.round(0.25 * 2) / 2 = Math.round(0.5) / 2 = 1 / 2 = 0.5
    expect(snapToHalfDay(0.25)).toBe(0.5);
  });

  it('handles negative half-day values', () => {
    expect(snapToHalfDay(-0.5)).toBe(-0.5);
    expect(snapToHalfDay(-1.3)).toBe(-1.5);
    expect(snapToHalfDay(-2.7)).toBe(-2.5);
  });
});

describe('TaskBar half-day drag/resize', () => {
  it('moves task by half a day on drag', () => {
    useProjectStore.setState({ tasks: [defaultTask] });
    const { getByTestId } = render(<TaskBar {...defaultProps} />);
    const bar = getByTestId('task-bar-t1');

    bar.setPointerCapture = () => {};
    bar.releasePointerCapture = () => {};

    // pixelsPerDay is 40, so half a day = 20px
    fireEvent.pointerDown(bar, { clientX: 100, clientY: 50, pointerId: 1 });
    // Move past direction threshold then half a day (20px)
    fireEvent.pointerMove(bar, { clientX: 120, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(bar, { clientX: 120, clientY: 50, pointerId: 1 });

    const updated = useProjectStore.getState().tasks.find((t) => t.id === 't1');
    expect(updated?.startDayIndex).toBe(5.5); // computedStart(5) + 0.5
  });

  it('resizes right edge by half a day', () => {
    useProjectStore.setState({ tasks: [defaultTask] });
    const { container } = render(<TaskBar {...defaultProps} />);
    // The right resize handle is the second [data-resize-handle]
    const handles = container.querySelectorAll('[data-resize-handle]');
    const rightHandle = handles[1] as HTMLElement;

    rightHandle.setPointerCapture = () => {};
    rightHandle.releasePointerCapture = () => {};

    // pixelsPerDay = 40, half day = 20px
    fireEvent.pointerDown(rightHandle, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(rightHandle, { clientX: 220, pointerId: 1 });
    fireEvent.pointerUp(rightHandle, { clientX: 220, pointerId: 1 });

    const updated = useProjectStore.getState().tasks.find((t) => t.id === 't1');
    expect(updated?.durationDays).toBe(3.5); // 3 + 0.5
  });

  it('resizes left edge by half a day', () => {
    useProjectStore.setState({ tasks: [defaultTask] });
    const { container } = render(<TaskBar {...defaultProps} />);
    const handles = container.querySelectorAll('[data-resize-handle]');
    const leftHandle = handles[0] as HTMLElement;

    leftHandle.setPointerCapture = () => {};
    leftHandle.releasePointerCapture = () => {};

    // Drag left by half day (20px to the left = -20)
    fireEvent.pointerDown(leftHandle, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(leftHandle, { clientX: 180, pointerId: 1 });
    fireEvent.pointerUp(leftHandle, { clientX: 180, pointerId: 1 });

    const updated = useProjectStore.getState().tasks.find((t) => t.id === 't1');
    expect(updated?.durationDays).toBe(3.5); // 3 + 0.5 (left edge moved left)
    expect(updated?.startDayIndex).toBe(-0.5); // startDayIndex(0) - 0.5
  });

  it('enforces minimum duration of 0.5 days on resize', () => {
    const shortTask = { ...defaultTask, durationDays: 1 };
    useProjectStore.setState({ tasks: [shortTask] });
    const { container } = render(
      <TaskBar {...defaultProps} task={shortTask} />
    );
    const handles = container.querySelectorAll('[data-resize-handle]');
    const rightHandle = handles[1] as HTMLElement;

    rightHandle.setPointerCapture = () => {};
    rightHandle.releasePointerCapture = () => {};

    // Shrink by 2 days worth (80px to the left) — should clamp to 0.5
    fireEvent.pointerDown(rightHandle, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(rightHandle, { clientX: 120, pointerId: 1 });
    fireEvent.pointerUp(rightHandle, { clientX: 120, pointerId: 1 });

    const updated = useProjectStore.getState().tasks.find((t) => t.id === 't1');
    expect(updated?.durationDays).toBe(0.5);
  });
});