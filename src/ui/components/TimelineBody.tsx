import { useMemo, useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { TaskBar } from './TaskBar';
import { DependencyArrows } from './DependencyArrows';
import { TodayLine } from './TodayLine';
import { ROW_HEIGHT } from '../constants';
import { buildVisualRowMap } from './layoutUtils';

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

  const { visibleTasks, taskRowIndex, totalVisualRows, rowItems } = useMemo(
    () => buildVisualRowMap(tasks, groups, collapsedGroupIds),
    [tasks, groups, collapsedGroupIds]
  );

  const handleVerticalDrop = useCallback((taskId: string, targetRowIndex: number) => {
    const movingIds = selectedTaskIds.includes(taskId) ? selectedTaskIds : [taskId];

    const item = rowItems[targetRowIndex];
    if (!item) return;

    const allSorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    const remaining = allSorted.filter((t) => !movingIds.includes(t.id));

    if (item.type === 'group-header') {
      const groupChildren = remaining.filter((t) => t.groupId === item.group.id);
      const lastChild = groupChildren[groupChildren.length - 1];
      const targetIdx = lastChild
        ? remaining.indexOf(lastChild) + 1
        : remaining.length;
      moveTasksToPosition(movingIds, targetIdx, item.group.id);
    } else {
      const targetGroupId = item.task.groupId;
      const targetIdx = remaining.findIndex((t) => t.id === item.task.id);
      moveTasksToPosition(movingIds, Math.max(0, targetIdx), targetGroupId);
    }
  }, [selectedTaskIds, rowItems, tasks, moveTasksToPosition]);

  return (
    <div className="relative" style={{ minHeight: totalVisualRows * ROW_HEIGHT }}>
      {/* Row lines */}
      {Array.from({ length: totalVisualRows }, (_, i) => (
        <div
          key={i}
          className="absolute w-full border-b border-gray-50"
          style={{ top: (i + 1) * ROW_HEIGHT }}
        />
      ))}

      {/* Today line (above row lines, below task bars) */}
      <TodayLine dayToPixel={dayToPixel} />

      {/* Dependency arrows */}
      <DependencyArrows
        columnWidth={columnWidth}
        rangeStartDayIndex={rangeStartDayIndex}
        pixelsPerDay={pixelsPerDay}
        dayToPixel={dayToPixel}
      />

      {/* Task bars */}
      {visibleTasks.map((task) => {
        const start = computedStarts.get(task.id) ?? task.startDayIndex;
        const rowIdx = taskRowIndex.get(task.id) ?? 0;
        return (
          <TaskBar
            key={task.id}
            task={task}
            computedStart={start}
            columnWidth={columnWidth}
            rowIndex={rowIdx}
            rangeStartDayIndex={rangeStartDayIndex}
            pixelsPerDay={pixelsPerDay}
            dayToPixel={dayToPixel}
            totalRows={totalVisualRows}
            onVerticalDrop={handleVerticalDrop}
          />
        );
      })}
    </div>
  );
}
