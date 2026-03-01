import { useCallback, useMemo, useState } from 'react';
import { HEADER_HEIGHT } from '../constants';
import { useProjectStore } from '../../store/useProjectStore';
import { SidebarTaskRow } from './SidebarTaskRow';
import { SidebarGroupRow } from './SidebarGroupRow';
import { ProjectHeader } from './ProjectHeader';
import { ExportImportButtons } from './ExportImportButtons';
import { SavedIndicator } from './SavedIndicator';
import { DebugButton } from './debug/DebugButton';

export function Sidebar() {
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const selectedTaskIds = useProjectStore((s) => s.selectedTaskIds);
  const addTask = useProjectStore((s) => s.addTask);
  const addGroup = useProjectStore((s) => s.addGroup);
  const selectTask = useProjectStore((s) => s.selectTask);
  const setEditingTaskId = useProjectStore((s) => s.setEditingTaskId);
  const moveTasksToPosition = useProjectStore((s) => s.moveTasksToPosition);

  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dragOverType, setDragOverType] = useState<'task' | 'group' | null>(null);

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.sortOrder - b.sortOrder),
    [tasks]
  );
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.sortOrder - b.sortOrder),
    [groups]
  );

  // Split tasks into ungrouped and grouped
  const { ungroupedTasks, groupedTasks } = useMemo(() => {
    const ungrouped = sortedTasks.filter((t) => !t.groupId);
    const grouped = new Map<string, typeof sortedTasks>();
    for (const t of sortedTasks) {
      if (t.groupId) {
        const arr = grouped.get(t.groupId) ?? [];
        arr.push(t);
        grouped.set(t.groupId, arr);
      }
    }
    return { ungroupedTasks: ungrouped, groupedTasks: grouped };
  }, [sortedTasks]);

  const handleAddTask = useCallback(async () => {
    const task = await addTask();
    selectTask(task.id);
    setEditingTaskId(task.id);
  }, [addTask, selectTask, setEditingTaskId]);

  const handleAddGroup = useCallback(async () => {
    await addGroup();
  }, [addGroup]);

  // --- Drag and drop handlers ---
  const handleTaskDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    // If the dragged task is not in the current selection, select it alone
    if (!selectedTaskIds.includes(taskId)) {
      selectTask(taskId);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }, [selectedTaskIds, selectTask]);

  const handleTaskDragOver = useCallback((e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItemId(taskId);
    setDragOverType('task');
  }, []);

  const handleGroupDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItemId(groupId);
    setDragOverType('group');
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropTargetId = dragOverItemId;
    const dropTargetType = dragOverType;
    setDragOverItemId(null);
    setDragOverType(null);

    if (!dropTargetId) return;

    // Determine which task IDs are being moved
    const currentSelection = useProjectStore.getState().selectedTaskIds;
    const movingIds = currentSelection.length > 0 ? currentSelection : [];
    if (movingIds.length === 0) return;

    if (dropTargetType === 'group') {
      // Dropped on a group header → assign tasks to that group
      // Find the position after the group's last child in the sorted task list
      const groupChildrenInSorted = sortedTasks.filter((t) => t.groupId === dropTargetId && !movingIds.includes(t.id));
      const lastGroupTask = groupChildrenInSorted.length > 0 ? groupChildrenInSorted[groupChildrenInSorted.length - 1] : null;
      const remaining = sortedTasks.filter((t) => !movingIds.includes(t.id));
      const targetIndex = lastGroupTask
        ? remaining.findIndex((t) => t.id === lastGroupTask.id) + 1
        : remaining.findIndex((t) => t.groupId === dropTargetId);

      await moveTasksToPosition(movingIds, Math.max(0, targetIndex === -1 ? remaining.length : targetIndex), dropTargetId);
    } else {
      // Dropped on a task row → insert before that task
      const dropTask = sortedTasks.find((t) => t.id === dropTargetId);
      const targetGroupId = dropTask?.groupId;
      const remaining = sortedTasks.filter((t) => !movingIds.includes(t.id));
      const targetIndex = remaining.findIndex((t) => t.id === dropTargetId);
      await moveTasksToPosition(movingIds, Math.max(0, targetIndex), targetGroupId);
    }
  }, [dragOverItemId, dragOverType, sortedTasks, groupedTasks, moveTasksToPosition]);

  const handleDragEnd = useCallback(() => {
    setDragOverItemId(null);
    setDragOverType(null);
  }, []);

  // Handle dropping on the empty area (ungroup / append to end)
  const handleListDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleListDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItemId(null);
    setDragOverType(null);
    const currentSelection = useProjectStore.getState().selectedTaskIds;
    if (currentSelection.length === 0) return;
    // Drop at end, no group
    await moveTasksToPosition(currentSelection, sortedTasks.length, undefined);
  }, [sortedTasks.length, moveTasksToPosition]);

  return (
    <div className="flex flex-col h-full" onDragEnd={handleDragEnd}>
      {/* Project name */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <ProjectHeader />
        <ExportImportButtons />
      </div>
      <div
        className="flex items-center justify-between px-3 font-semibold text-sm text-gray-500 border-b border-gray-200 flex-shrink-0"
        style={{ height: HEADER_HEIGHT }}
      >
        <span>Tasks</span>
        <div className="flex gap-1">
          <button
            onClick={handleAddGroup}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 text-xs leading-none"
            title="Add group"
            data-testid="add-group-btn"
          >
            G+
          </button>
          <button
            onClick={handleAddTask}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 text-lg leading-none"
            title="Add task"
            data-testid="add-task-btn"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" onDragOver={handleListDragOver} onDrop={handleListDrop}>
        {/* Ungrouped tasks first */}
        {ungroupedTasks.map((task) => (
          <SidebarTaskRow
            key={task.id}
            task={task}
            indented={false}
            onDragStart={handleTaskDragStart}
            onDragOver={(e) => handleTaskDragOver(e, task.id)}
            onDrop={handleDrop}
            isDragOver={dragOverItemId === task.id && dragOverType === 'task'}
          />
        ))}

        {/* Groups with their children */}
        {sortedGroups.map((group) => {
          const children = groupedTasks.get(group.id) ?? [];
          return (
            <div key={group.id}>
              <SidebarGroupRow
                group={group}
                onDragOver={(e) => handleGroupDragOver(e, group.id)}
                onDrop={handleDrop}
                isDragOver={dragOverItemId === group.id && dragOverType === 'group'}
              />
              {!group.collapsed &&
                children.map((task) => (
                  <SidebarTaskRow
                    key={task.id}
                    task={task}
                    indented
                    onDragStart={handleTaskDragStart}
                    onDragOver={(e) => handleTaskDragOver(e, task.id)}
                    onDrop={handleDrop}
                    isDragOver={dragOverItemId === task.id && dragOverType === 'task'}
                  />
                ))}
            </div>
          );
        })}
      </div>
      <SavedIndicator />
      <DebugButton />
    </div>
  );
}
