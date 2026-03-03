import { useEffect, useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { ROW_HEIGHT, HEADER_HEIGHT } from '../constants';
import { BAR_HEIGHT } from './TaskBar';
import { buildVisualRowMap } from './layoutUtils';

interface LinkingLineProps {
  dayToPixel: (dayIndex: number) => number;
  scrollContainer: HTMLElement | null;
  sidebarWidth?: number;
}

const BAR_VERTICAL_PADDING = (ROW_HEIGHT - BAR_HEIGHT) / 2;

export function LinkingLine({ dayToPixel, scrollContainer, sidebarWidth = 250 }: LinkingLineProps) {
  const linkingFromTaskId = useProjectStore((s) => s.linkingFromTaskId);
  const setLinkingFromTaskId = useProjectStore((s) => s.setLinkingFromTaskId);
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const computedStarts = useProjectStore((s) => s.computedStarts);

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const task = linkingFromTaskId
    ? tasks.find((t) => t.id === linkingFromTaskId)
    : undefined;

  // Compute visible row index for the source task using the same layout as TimelineBody
  const collapsedGroupIds = useMemo(
    () => new Set(groups.filter((g) => g.collapsed).map((g) => g.id)),
    [groups]
  );
  const { taskRowIndex } = useMemo(
    () => buildVisualRowMap(tasks, groups, collapsedGroupIds),
    [tasks, groups, collapsedGroupIds]
  );
  const rowIndex = task ? (taskRowIndex.get(task.id) ?? -1) : -1;

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
        x: e.clientX - rect.left + scrollContainer.scrollLeft - sidebarWidth,
        y: e.clientY - rect.top + scrollContainer.scrollTop - HEADER_HEIGHT,
      });
    },
    [scrollContainer, sidebarWidth]
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

  /**
   * Build a rounded-corner Z-shaped path from (sx, sy) to (tx, ty) via a midX elbow.
   * Matches the arrow path style used in DependencyArrows.
   */
  const buildArrowPath = (sx: number, sy: number, tx: number, ty: number): string => {
    const midX = sx + 12;
    if (sy === ty) {
      return `M ${sx} ${sy} L ${tx} ${ty}`;
    }
    const dy = ty - sy;
    const absDy = Math.abs(dy);
    const dirY = dy > 0 ? 1 : -1;
    const r = Math.min(10, absDy / 2, Math.abs(midX - sx) / 2, Math.abs(tx - midX) / 2);
    return [
      `M ${sx} ${sy}`,
      `L ${midX - r} ${sy}`,
      `Q ${midX} ${sy} ${midX} ${sy + r * dirY}`,
      `L ${midX} ${ty - r * dirY}`,
      `Q ${midX} ${ty} ${midX + r} ${ty}`,
      `L ${tx} ${ty}`,
    ].join(' ');
  };

  if (!linkingFromTaskId || !sourcePoint || !cursorPos) return null;

  const arrowPath = buildArrowPath(sourcePoint.x, sourcePoint.y, cursorPos.x, cursorPos.y);

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-30"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      data-testid="linking-line"
    >
      <defs>
        <marker
          id="linking-arrow"
          markerWidth="5"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 5 2, 0 4" fill="#9CA3AF" fillOpacity="0.6" />
        </marker>
      </defs>
      <path
        d={arrowPath}
        fill="none"
        stroke="#9CA3AF"
        strokeWidth={1.5}
        strokeOpacity={0.6}
        strokeDasharray="6 3"
        markerEnd="url(#linking-arrow)"
      />
    </svg>
  );
}
