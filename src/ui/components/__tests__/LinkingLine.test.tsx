import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { LinkingLine } from '../LinkingLine';
import { useProjectStore } from '../../../store/useProjectStore';
import { ROW_HEIGHT, HEADER_HEIGHT } from '../../constants';
import { BAR_HEIGHT } from '../TaskBar';
import type { Task, Group } from '../../../domain/types';

const BAR_VERTICAL_PADDING = (ROW_HEIGHT - BAR_HEIGHT) / 2;

const baseState = {
  tasks: [] as Task[],
  dependencies: [],
  groups: [] as Group[],
  computedStarts: new Map<string, number>(),
  scheduleError: null,
  cycleTaskIds: [],
  selectedTaskIds: [],
  selectionAnchorId: null,
  editingTaskId: null,
  linkingFromTaskId: null as string | null,
  lastSavedAt: null,
  isLoaded: true,
  hydrationError: null,
  persistError: null,
};

const dayToPixel = (dayIndex: number) => dayIndex * 40;

beforeEach(() => {
  useProjectStore.setState(baseState);
});

describe('LinkingLine', () => {
  it('renders nothing when not linking', () => {
    const { container } = render(
      <LinkingLine dayToPixel={dayToPixel} scrollContainer={null} />
    );
    expect(container.querySelector('[data-testid="linking-line"]')).toBeNull();
  });

  describe('source point with groups', () => {
    it('accounts for group header row when computing source Y', () => {
      const group: Group = { id: 'g1', name: 'Frontend', collapsed: false, sortOrder: 0 };
      const task: Task = {
        id: 'task1',
        name: 'Design',
        startDayIndex: 5,
        durationDays: 3,
        groupId: 'g1',
        color: '#3B82F6',
        sortOrder: 1,
      };

      useProjectStore.setState({
        ...baseState,
        tasks: [task],
        groups: [group],
        computedStarts: new Map([['task1', 5]]),
        linkingFromTaskId: 'task1',
      });

      // Simulate a pointer move so cursorPos is set and the SVG renders
      const mockContainer = {
        getBoundingClientRect: () => ({ top: 0, left: 0, right: 1000, bottom: 800, width: 1000, height: 800 }),
        scrollLeft: 0,
        scrollTop: 0,
      } as unknown as HTMLElement;

      const { queryByTestId } = render(
        <LinkingLine dayToPixel={dayToPixel} scrollContainer={mockContainer} sidebarWidth={250} />
      );

      // Trigger pointermove to set cursorPos
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 500, clientY: 200 }));
      });

      const svg = queryByTestId('linking-line');
      expect(svg).not.toBeNull();

      const path = svg!.querySelector('path')!;
      const d = path.getAttribute('d')!;

      // Task is in group g1, so group header is row 0, task is row 1
      const expectedY = 1 * ROW_HEIGHT + BAR_VERTICAL_PADDING + BAR_HEIGHT / 2;
      // Path starts with M sx sy — extract the starting Y
      const match = d.match(/^M (\S+) (\S+)/);
      expect(match).not.toBeNull();
      expect(parseFloat(match![2])).toBe(expectedY);
    });

    it('places ungrouped task at row 0 (no group header offset)', () => {
      const task: Task = {
        id: 'task1',
        name: 'Standalone',
        startDayIndex: 5,
        durationDays: 3,
        color: '#3B82F6',
        sortOrder: 0,
      };

      useProjectStore.setState({
        ...baseState,
        tasks: [task],
        groups: [],
        computedStarts: new Map([['task1', 5]]),
        linkingFromTaskId: 'task1',
      });

      const mockContainer = {
        getBoundingClientRect: () => ({ top: 0, left: 0, right: 1000, bottom: 800, width: 1000, height: 800 }),
        scrollLeft: 0,
        scrollTop: 0,
      } as unknown as HTMLElement;

      const { queryByTestId } = render(
        <LinkingLine dayToPixel={dayToPixel} scrollContainer={mockContainer} sidebarWidth={250} />
      );

      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 500, clientY: 200 }));
      });

      const svg = queryByTestId('linking-line');
      expect(svg).not.toBeNull();

      const path = svg!.querySelector('path')!;
      const d = path.getAttribute('d')!;

      // No group headers, task is at row 0
      const expectedY = 0 * ROW_HEIGHT + BAR_VERTICAL_PADDING + BAR_HEIGHT / 2;
      const match = d.match(/^M (\S+) (\S+)/);
      expect(match).not.toBeNull();
      expect(parseFloat(match![2])).toBe(expectedY);
    });
  });

  describe('cursor position', () => {
    it('subtracts HEADER_HEIGHT from cursor Y coordinate', () => {
      const task: Task = {
        id: 'task1',
        name: 'Test',
        startDayIndex: 0,
        durationDays: 2,
        color: '#3B82F6',
        sortOrder: 0,
      };

      useProjectStore.setState({
        ...baseState,
        tasks: [task],
        computedStarts: new Map([['task1', 0]]),
        linkingFromTaskId: 'task1',
      });

      const mockContainer = {
        getBoundingClientRect: () => ({ top: 100, left: 50, right: 1050, bottom: 900, width: 1000, height: 800 }),
        scrollLeft: 0,
        scrollTop: 0,
      } as unknown as HTMLElement;

      const sidebarWidth = 250;

      const { queryByTestId } = render(
        <LinkingLine dayToPixel={dayToPixel} scrollContainer={mockContainer} sidebarWidth={sidebarWidth} />
      );

      // Simulate pointer at clientX=600, clientY=300
      act(() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 600, clientY: 300 }));
      });

      const svg = queryByTestId('linking-line');
      expect(svg).not.toBeNull();

      const path = svg!.querySelector('path')!;
      const d = path.getAttribute('d')!;

      // The path ends at the cursor position — extract the last L tx ty segment
      const segments = d.split(' L ');
      const lastSegment = segments[segments.length - 1];
      const [endXStr, endYStr] = lastSegment.split(' ');
      const endX = parseFloat(endXStr);
      const endY = parseFloat(endYStr);

      // x: clientX(600) - rect.left(50) + scrollLeft(0) - sidebarWidth(250) = 300
      expect(endX).toBe(300);
      // y: clientY(300) - rect.top(100) + scrollTop(0) - HEADER_HEIGHT(48) = 152
      expect(endY).toBe(300 - 100 - HEADER_HEIGHT);
    });
  });
});
