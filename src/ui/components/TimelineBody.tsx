import { useMemo, useCallback } from 'react';
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
  const moveTasksToPosition = useProjectStore((s) => s.moveTasksToPosition);
  const selectedTaskIds = useProjectStore((s) => s.selectedTaskIds);

  const collapsedGroupIds = useMemo(
    () => new Set(groups.filter((g) => g.collapsed).map((g) => g.id)),
    [groups]
  );
  const sortedTasks = useMemo(
    () => [...tasks]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((t) => !t.groupId || !collapsedGroupIds.has(t.groupId)),
    [tasks, collapsedGroupIds]
  );

  const handleVerticalDrop = useCallback((taskId: string, targetRowIndex: number) => {
    // Determine which tasks to move
    const movingIds = selectedTaskIds.includes(taskId) ? selectedTaskIds : [taskId];

    // Determine the target task's group from the target row position
    const targetTask = sortedTasks[targetRowIndex];
    const targetGroupId = targetTask?.groupId;

    // Compute insertion index in the full sorted task list
    // We need to map the visible row index back to the full sorted list index
    const allSorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    const remaining = allSorted.filter((t) => !movingIds.includes(t.id));
    const targetIdx = targetTask
      ? remaining.findIndex((t) => t.id === targetTask.id)
      : remaining.length;

    moveTasksToPosition(movingIds, Math.max(0, targetIdx), targetGroupId);
  }, [selectedTaskIds, sortedTasks, tasks, moveTasksToPosition]);

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
            totalRows={sortedTasks.length}
            onVerticalDrop={handleVerticalDrop}
          />
        );
      })}
    </div>
  );
}
