import { useProjectStore } from '../../store/useProjectStore';
import { TaskBar } from './TaskBar';
import { DependencyArrows } from './DependencyArrows';
import { ROW_HEIGHT } from '../constants';

interface TimelineBodyProps {
  columnWidth: number;
  rangeStartDayIndex: number;
  pixelsPerDay: number;
  dayToPixel: (dayIndex: number) => number;
}

export function TimelineBody({ columnWidth, rangeStartDayIndex, pixelsPerDay, dayToPixel }: TimelineBodyProps) {
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const computedStarts = useProjectStore((s) => s.computedStarts);

  const collapsedGroupIds = new Set(groups.filter((g) => g.collapsed).map((g) => g.id));
  const sortedTasks = [...tasks]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((t) => !t.groupId || !collapsedGroupIds.has(t.groupId));

  return (
    <div className="relative" style={{ minHeight: sortedTasks.length * ROW_HEIGHT }}>
      {/* Row lines */}
      {sortedTasks.map((_, i) => (
        <div
          key={i}
          className="absolute w-full border-b border-gray-50"
          style={{ top: (i + 1) * ROW_HEIGHT }}
        />
      ))}

      {/* Dependency arrows */}
      <DependencyArrows
        columnWidth={columnWidth}
        rangeStartDayIndex={rangeStartDayIndex}
        pixelsPerDay={pixelsPerDay}
        dayToPixel={dayToPixel}
      />

      {/* Task bars */}
      {sortedTasks.map((task, i) => {
        const start = computedStarts.get(task.id) ?? task.startDayIndex;
        return (
          <TaskBar
            key={task.id}
            task={task}
            computedStart={start}
            columnWidth={columnWidth}
            rowIndex={i}
            rangeStartDayIndex={rangeStartDayIndex}
            pixelsPerDay={pixelsPerDay}
            dayToPixel={dayToPixel}
          />
        );
      })}
    </div>
  );
}
