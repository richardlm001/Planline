import { useEffect, useState, useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { ROW_HEIGHT } from '../constants';
import { BAR_HEIGHT } from './TaskBar';

interface LinkingLineProps {
  dayToPixel: (dayIndex: number) => number;
  scrollContainer: HTMLElement | null;
}

const BAR_VERTICAL_PADDING = (ROW_HEIGHT - BAR_HEIGHT) / 2;

export function LinkingLine({ dayToPixel, scrollContainer }: LinkingLineProps) {
  const linkingFromTaskId = useProjectStore((s) => s.linkingFromTaskId);
  const setLinkingFromTaskId = useProjectStore((s) => s.setLinkingFromTaskId);
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const computedStarts = useProjectStore((s) => s.computedStarts);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const task = linkingFromTaskId
    ? tasks.find((t) => t.id === linkingFromTaskId)
    : undefined;

  // Compute visible row index for the source task
  const collapsedGroupIds = new Set(
    groups.filter((g) => g.collapsed).map((g) => g.id)
  );
  const sortedVisibleTasks = [...tasks]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((t) => !t.groupId || !collapsedGroupIds.has(t.groupId));
  const rowIndex = task ? sortedVisibleTasks.findIndex((t) => t.id === task.id) : -1;

  // Source point: right edge center of the source task bar
  const sourcePoint =
    task && rowIndex >= 0
      ? (() => {
          const start = computedStarts.get(task.id) ?? task.startDayIndex;
          const sx = dayToPixel(start + task.durationDays);
          const sy = rowIndex * ROW_HEIGHT + BAR_VERTICAL_PADDING + BAR_HEIGHT / 2;
          return { x: sx, y: sy };
        })()
      : null;

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!scrollContainer) return;
      const rect = scrollContainer.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left + scrollContainer.scrollLeft,
        y: e.clientY - rect.top + scrollContainer.scrollTop,
      });
    },
    [scrollContainer]
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      // Only cancel if not releasing on a valid input connector
      const target = e.target as HTMLElement;
      if (!target.dataset.testid?.startsWith('connector-in-')) {
        setLinkingFromTaskId(null);
      }
    },
    [setLinkingFromTaskId]
  );

  useEffect(() => {
    if (!linkingFromTaskId) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [linkingFromTaskId, handlePointerMove, handlePointerUp]);

  if (!linkingFromTaskId || !sourcePoint || !cursorPos) return null;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-30"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      data-testid="linking-line"
    >
      <line
        x1={sourcePoint.x}
        y1={sourcePoint.y}
        x2={cursorPos.x}
        y2={cursorPos.y}
        stroke="#F59E0B"
        strokeWidth={2}
        strokeDasharray="6 3"
      />
    </svg>
  );
}
