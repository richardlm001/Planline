import { useMemo, useId } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { ROW_HEIGHT } from '../constants';
import { BAR_HEIGHT } from './TaskBar';
import { buildVisualRowMap } from './layoutUtils';

interface DependencyArrowsProps {
  columnWidth: number;
  rangeStartDayIndex: number;
  pixelsPerDay: number;
  dayToPixel: (dayIndex: number) => number;
}

export function DependencyArrows({ dayToPixel }: DependencyArrowsProps) {
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const dependencies = useProjectStore((s) => s.dependencies);
  const computedStarts = useProjectStore((s) => s.computedStarts);
  const markerId = useId();
  const dashedMarkerId = `${markerId}-dashed`;

  const collapsedGroupIds = useMemo(
    () => new Set(groups.filter((g) => g.collapsed).map((g) => g.id)),
    [groups]
  );

  // Build visual row mapping that matches sidebar ordering
  // (ungrouped tasks first, then groups with headers + children)
  const { taskRowIndex: taskIndexMap, groupHeaderRowIndex, totalVisualRows } = useMemo(
    () => buildVisualRowMap(tasks, groups, collapsedGroupIds),
    [tasks, groups, collapsedGroupIds]
  );

  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks]
  );

  const barVerticalPadding = (ROW_HEIGHT - BAR_HEIGHT) / 2;
  const barCenterY = (rowIndex: number) =>
    rowIndex * ROW_HEIGHT + barVerticalPadding + BAR_HEIGHT / 2;

  /**
   * Build a rounded-corner Z-shaped path from (sx, sy) to (tx, ty) via a midX elbow.
   * When sy === ty (same row), draws a straight horizontal line.
   */
  const buildArrowPath = (sx: number, sy: number, tx: number, ty: number): string => {
    const midX = sx + 12;
    // Same row — straight line
    if (sy === ty) {
      return `M ${sx} ${sy} L ${tx} ${ty}`;
    }
    const dy = ty - sy;
    const absDy = Math.abs(dy);
    const dirY = dy > 0 ? 1 : -1;
    // Corner radius, clamped to avoid overshooting
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

  const arrows = dependencies.map((dep) => {
    const fromTask = taskMap.get(dep.fromTaskId);
    const toTask = taskMap.get(dep.toTaskId);
    if (!fromTask || !toTask) return null;

    const fromRow = taskIndexMap.get(dep.fromTaskId);
    const toRow = taskIndexMap.get(dep.toTaskId);

    // Both tasks visible — normal arrow
    if (fromRow !== undefined && toRow !== undefined) {
      const fromStart = computedStarts.get(dep.fromTaskId) ?? fromTask.startDayIndex;
      const toStart = computedStarts.get(dep.toTaskId) ?? toTask.startDayIndex;

      const sx = dayToPixel(fromStart + fromTask.durationDays);
      const sy = barCenterY(fromRow);
      const tx = dayToPixel(toStart);
      const ty = barCenterY(toRow);

      const arrowPath = buildArrowPath(sx, sy, tx, ty);

      return (
        <g key={dep.id}>
          <path
            d={arrowPath}
            fill="none"
            stroke="#9CA3AF"
            strokeWidth={1.5}
            markerEnd={`url(#${markerId})`}
          />
        </g>
      );
    }

    // At least one task is hidden (collapsed group) — draw a dashed summary arrow
    const resolveRow = (taskId: string, task: { groupId?: string }) => {
      const row = taskIndexMap.get(taskId);
      if (row !== undefined) return row;
      if (task.groupId && collapsedGroupIds.has(task.groupId)) {
        return groupHeaderRowIndex.get(task.groupId) ?? 0;
      }
      return undefined;
    };

    const effectiveFromRow = resolveRow(dep.fromTaskId, fromTask);
    const effectiveToRow = resolveRow(dep.toTaskId, toTask);
    if (effectiveFromRow === undefined || effectiveToRow === undefined) return null;

    const fromStart = computedStarts.get(dep.fromTaskId) ?? fromTask.startDayIndex;
    const toStart = computedStarts.get(dep.toTaskId) ?? toTask.startDayIndex;

    const sx = dayToPixel(fromStart + fromTask.durationDays);
    const sy = barCenterY(effectiveFromRow);
    const tx = dayToPixel(toStart);
    const ty = barCenterY(effectiveToRow);

    const arrowPath = buildArrowPath(sx, sy, tx, ty);

    return (
      <g key={dep.id} data-testid={`dep-arrow-collapsed-${dep.id}`}>
        <path
          d={arrowPath}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeOpacity={0.6}
          markerEnd={`url(#${dashedMarkerId})`}
        />
      </g>
    );
  });

  // Get total height
  const totalHeight = Math.max(totalVisualRows * ROW_HEIGHT, 200);

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: '100%', height: totalHeight, overflow: 'visible' }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
        </marker>
        <marker
          id={dashedMarkerId}
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" fillOpacity="0.6" />
        </marker>
      </defs>
      {arrows}
    </svg>
  );
}
