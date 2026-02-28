import { useProjectStore } from '../../store/useProjectStore';
import { ROW_HEIGHT } from '../constants';
import { BAR_HEIGHT } from './TaskBar';

interface DependencyArrowsProps {
  columnWidth: number;
  rangeStartDayIndex: number;
  pixelsPerDay: number;
  dayToPixel: (dayIndex: number) => number;
}

export function DependencyArrows({ dayToPixel }: DependencyArrowsProps) {
  const tasks = useProjectStore((s) => s.tasks);
  const dependencies = useProjectStore((s) => s.dependencies);
  const computedStarts = useProjectStore((s) => s.computedStarts);

  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const taskIndexMap = new Map<string, number>();
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  sortedTasks.forEach((t, i) => taskIndexMap.set(t.id, i));

  const barVerticalPadding = (ROW_HEIGHT - BAR_HEIGHT) / 2;
  const barCenterY = (rowIndex: number) =>
    rowIndex * ROW_HEIGHT + barVerticalPadding + BAR_HEIGHT / 2;

  const arrows = dependencies.map((dep) => {
    const fromTask = taskMap.get(dep.fromTaskId);
    const toTask = taskMap.get(dep.toTaskId);
    if (!fromTask || !toTask) return null;

    const fromRow = taskIndexMap.get(dep.fromTaskId);
    const toRow = taskIndexMap.get(dep.toTaskId);
    if (fromRow === undefined || toRow === undefined) return null;

    const fromStart = computedStarts.get(dep.fromTaskId) ?? fromTask.startDayIndex;
    const toStart = computedStarts.get(dep.toTaskId) ?? toTask.startDayIndex;

    // Source: right edge of predecessor
    const sx = dayToPixel(fromStart + fromTask.durationDays);
    const sy = barCenterY(fromRow);

    // Target: left edge of successor
    const tx = dayToPixel(toStart);
    const ty = barCenterY(toRow);

    // Create a path with a horizontal offset then vertical then horizontal
    const midX = sx + 12;
    const path = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;

    return (
      <g key={dep.id}>
        <path
          d={path}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth={1.5}
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  });

  // Get total height
  const totalHeight = Math.max(sortedTasks.length * ROW_HEIGHT, 200);

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-5"
      style={{ width: '100%', height: totalHeight, overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#9CA3AF" />
        </marker>
      </defs>
      {arrows}
    </svg>
  );
}
