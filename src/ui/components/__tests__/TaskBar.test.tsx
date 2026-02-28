import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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
    selectedTaskId: null,
    editingTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
  });
});

describe('TaskBar', () => {
  it('renders with correct left/width style', () => {
    const task = {
      id: 't1',
      name: 'Test Task',
      startDayIndex: 0,
      durationDays: 3,
      color: '#3B82F6',
      sortOrder: 0,
    };

    const dayToPixel = (dayIndex: number) => dayIndex * 40;

    const { container } = render(
      <TaskBar
        task={task}
        computedStart={5}
        columnWidth={40}
        rowIndex={0}
        rangeStartDayIndex={0}
        pixelsPerDay={40}
        dayToPixel={dayToPixel}
      />
    );

    const bar = container.firstElementChild as HTMLElement;
    expect(bar.style.left).toBe('200px'); // 5 * 40
    expect(bar.style.width).toBe('120px'); // 3 * 40
    expect(bar.textContent).toBe('Test Task');
  });
});
