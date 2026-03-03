import { useCallback, useMemo, useState } from 'react';
import { HEADER_HEIGHT } from '../constants';
import { useProjectStore } from '../../store/useProjectStore';
import { SidebarTaskRow } from './SidebarTaskRow';
import { SidebarGroupRow } from './SidebarGroupRow';
import { Plus, FolderPlus } from 'lucide-react';


interface SidebarProps {
  width: number;
}

export function Sidebar({ width }: SidebarProps) {
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const selectedTaskIds = useProjectStore((s) => s.selectedTaskIds);
  const addTask = useProjectStore((s) => s.addTask);
  const addGroup = useProjectStore((s) => s.addGroup);
  const selectTask = useProjectStore((s) => s.selectTask);
  const selectGroup = useProjectStore((s) => s.selectGroup);
  const setEditingTaskId = useProjectStore((s) => s.setEditingTaskId);
  const setEditingGroupId = useProjectStore((s) => s.setEditingGroupId);
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

  // Build a unified top-level list interleaving ungrouped tasks and groups by sortOrder
  const topLevelItems = useMemo(() => {
    type Item =
      | { type: 'task'; task: typeof sortedTasks[0]; sortOrder: number }
      | { type: 'group'; group: typeof sortedGroups[0]; sortOrder: number; children: typeof sortedTasks };
    const items: Item[] = [
      ...ungroupedTasks.map((task) => ({ type: 'task' as const, task, sortOrder: task.sortOrder })),
      ...sortedGroups.map((group) => ({
        type: 'group' as const,
        group,
        sortOrder: group.sortOrder,
        children: groupedTasks.get(group.id) ?? [],
      })),
    ];
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return items;
  }, [ungroupedTasks, sortedGroups, groupedTasks]);

  const handleAddTask = useCallback(async () => {
    const task = await addTask();
    selectTask(task.id);
    setEditingTaskId(task.id);
  }, [addTask, selectTask, setEditingTaskId]);

  const handleAddGroup = useCallback(async () => {
    const newGroup = await addGroup();
    selectGroup(newGroup.id);
    setEditingGroupId(newGroup.id);
  }, [addGroup, selectGroup, setEditingGroupId]);

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
    <div
      className="sticky left-0 z-30 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col"
      style={{ width }}
      onDragEnd={handleDragEnd}
      onDragOver={handleListDragOver}
      onDrop={handleListDrop}
    >
      {/* Sticky Tasks header (corner pin: sticky top + left) */}
      <div
        className="sticky top-0 z-40 bg-gray-50 flex items-center justify-between px-3 font-semibold text-xs text-gray-500 border-b border-gray-200"
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
              <FolderPlus size={14} />
            </button>
            <button
              onClick={handleAddTask}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 text-lg leading-none"
              title="Add task"
              data-testid="add-task-btn"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1">
        {topLevelItems.map((item) => {
          if (item.type === 'task') {
            return (
              <SidebarTaskRow
                key={item.task.id}
                task={item.task}
                indented={false}
                onDragStart={handleTaskDragStart}
                onDragOver={(e) => handleTaskDragOver(e, item.task.id)}
                onDrop={handleDrop}
                isDragOver={dragOverItemId === item.task.id && dragOverType === 'task'}
              />
            );
          }
          return (
            <div key={item.group.id}>
              <SidebarGroupRow
                group={item.group}
                onDragOver={(e) => handleGroupDragOver(e, item.group.id)}
                onDrop={handleDrop}
                isDragOver={dragOverItemId === item.group.id && dragOverType === 'group'}
              />
              {!item.group.collapsed &&
                item.children.map((task) => (
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
    </div>
  );
}
