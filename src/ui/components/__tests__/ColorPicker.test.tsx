import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { ColorPicker } from '../ColorPicker';
import { COLOR_PALETTE } from '../../../domain/constants';

beforeEach(() => {
  useProjectStore.setState({
    tasks: [
      { id: 't1', name: 'Task', startDayIndex: 0, durationDays: 1, color: COLOR_PALETTE[0], sortOrder: 0 },
    ],
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
  });
});

describe('ColorPicker', () => {
  it('opens popover and changes task color', () => {
    render(<ColorPicker taskId="t1" currentColor={COLOR_PALETTE[0]} />);

    // Click the color trigger
    fireEvent.click(screen.getByTestId('color-trigger-t1'));

    // Popover should be visible with all palette colors
    expect(screen.getByTestId('color-picker-t1')).toBeTruthy();

    // Click a different swatch
    const newColor = COLOR_PALETTE[3];
    fireEvent.click(screen.getByTestId(`color-swatch-${newColor}`));

    // Task color should be updated
    const task = useProjectStore.getState().tasks.find((t) => t.id === 't1');
    expect(task?.color).toBe(newColor);
  });

  it('new tasks cycle through the palette', async () => {
    const store = useProjectStore.getState();
    // Add tasks and verify color cycling
    const t2 = await store.addTask();
    expect(t2.color).toBe(COLOR_PALETTE[1]); // 1 existing task, so index 1

    const t3 = await store.addTask();
    expect(t3.color).toBe(COLOR_PALETTE[2]);
  });
});
