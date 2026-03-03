import { useMemo, useId, useState, useCallback } from 'react';
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
  const dragOverrides = useProjectStore((s) => s.dragOverrides);
  const selectedDependencyId = useProjectStore((s) => s.selectedDependencyId);
  const selectDependency = useProjectStore((s) => s.selectDependency);
  const markerId = useId();
  const dashedMarkerId = `${markerId}-dashed`;
  const [hoveredDepId, setHoveredDepId] = useState<string | null>(null);

  const handleArrowClick = useCallback(
    (depId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectDependency(depId);
    },
    [selectDependency]
  );

  const handleMouseEnter = useCallback((depId: string) => {
    setHoveredDepId(depId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredDepId(null);
  }, []);

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
      const fromOverride = dragOverrides.get(dep.fromTaskId);
      const toOverride = dragOverrides.get(dep.toTaskId);
      const fromStart = fromOverride?.start ?? computedStarts.get(dep.fromTaskId) ?? fromTask.startDayIndex;
      const toStart = toOverride?.start ?? computedStarts.get(dep.toTaskId) ?? toTask.startDayIndex;
      const fromDuration = fromOverride?.durationDays ?? fromTask.durationDays;

      const sx = dayToPixel(fromStart + fromDuration);
      const sy = barCenterY(fromRow);
      const tx = dayToPixel(toStart);
      const ty = barCenterY(toRow);

      const arrowPath = buildArrowPath(sx, sy, tx, ty);
      const isSelected = selectedDependencyId === dep.id;
      const isHovered = hoveredDepId === dep.id;
      const opacity = isSelected || isHovered ? 1 : 0.3;
      const strokeColor = isSelected ? '#3B82F6' : '#9CA3AF';

      return (
        <g
          key={dep.id}
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onMouseEnter={() => handleMouseEnter(dep.id)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleArrowClick(dep.id, e)}
          data-testid={`dep-arrow-${dep.id}`}
        >
          {/* Invisible wider hit area */}
          <path
            d={arrowPath}
            fill="none"
            stroke="transparent"
            strokeWidth={12}
          />
          <path
            d={arrowPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={isSelected ? 2 : 1.5}
            strokeOpacity={opacity}
            markerEnd={`url(#${isSelected ? `${markerId}-selected` : isHovered ? `${markerId}-hovered` : markerId})`}
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

    const fromOverride = dragOverrides.get(dep.fromTaskId);
    const toOverride = dragOverrides.get(dep.toTaskId);
    const fromStart = fromOverride?.start ?? computedStarts.get(dep.fromTaskId) ?? fromTask.startDayIndex;
    const toStart = toOverride?.start ?? computedStarts.get(dep.toTaskId) ?? toTask.startDayIndex;
    const fromDuration = fromOverride?.durationDays ?? fromTask.durationDays;

    const sx = dayToPixel(fromStart + fromDuration);
    const sy = barCenterY(effectiveFromRow);
    const tx = dayToPixel(toStart);
    const ty = barCenterY(effectiveToRow);

    const arrowPath = buildArrowPath(sx, sy, tx, ty);
    const isSelected = selectedDependencyId === dep.id;
    const isHovered = hoveredDepId === dep.id;
    const opacity = isSelected || isHovered ? 0.8 : 0.2;
    const strokeColor = isSelected ? '#3B82F6' : '#9CA3AF';

    return (
      <g
        key={dep.id}
        data-testid={`dep-arrow-collapsed-${dep.id}`}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onMouseEnter={() => handleMouseEnter(dep.id)}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => handleArrowClick(dep.id, e)}
      >
        {/* Invisible wider hit area */}
        <path
          d={arrowPath}
          fill="none"
          stroke="transparent"
          strokeWidth={12}
        />
        <path
          d={arrowPath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isSelected ? 2 : 1.5}
          strokeDasharray="4 3"
          strokeOpacity={opacity}
          markerEnd={`url(#${isSelected ? `${markerId}-selected` : isHovered ? `${markerId}-hovered` : dashedMarkerId})`}
        />
      </g>
    );
  });

  // Get total height
  const totalHeight = Math.max(totalVisualRows * ROW_HEIGHT, 200);

  return (
    <svg
      className="absolute top-0 left-0"
      style={{ width: '100%', height: totalHeight, overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth="5"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 5 2, 0 4" fill="#9CA3AF" fillOpacity="0.3" />
        </marker>
        <marker
          id={`${markerId}-hovered`}
          markerWidth="5"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 5 2, 0 4" fill="#9CA3AF" />
        </marker>
        <marker
          id={`${markerId}-selected`}
          markerWidth="5"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 5 2, 0 4" fill="#3B82F6" />
        </marker>
        <marker
          id={dashedMarkerId}
          markerWidth="5"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <polygon points="0 0, 5 2, 0 4" fill="#9CA3AF" fillOpacity="0.2" />
        </marker>
      </defs>
      {arrows}
    </svg>
  );
}
