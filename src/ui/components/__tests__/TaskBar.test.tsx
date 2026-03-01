import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { TaskBar } from '../TaskBar';
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
});
