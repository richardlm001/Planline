import { useCallback } from 'react';
import { HEADER_HEIGHT } from '../constants';
import { useProjectStore } from '../../store/useProjectStore';
import { SidebarTaskRow } from './SidebarTaskRow';
import { SidebarGroupRow } from './SidebarGroupRow';
import { ProjectHeader } from './ProjectHeader';
import { ExportImportButtons } from './ExportImportButtons';
import { SavedIndicator } from './SavedIndicator';

export function Sidebar() {
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const addTask = useProjectStore((s) => s.addTask);
  const addGroup = useProjectStore((s) => s.addGroup);
  const selectTask = useProjectStore((s) => s.selectTask);
  const setEditingTaskId = useProjectStore((s) => s.setEditingTaskId);

  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // Split tasks into ungrouped and grouped
  const ungroupedTasks = sortedTasks.filter((t) => !t.groupId);
  const groupedTasks = new Map<string, typeof sortedTasks>();
  for (const t of sortedTasks) {
    if (t.groupId) {
      const arr = groupedTasks.get(t.groupId) ?? [];
      arr.push(t);
      groupedTasks.set(t.groupId, arr);
    }
  }

  const handleAddTask = useCallback(async () => {
    const task = await addTask();
    selectTask(task.id);
    setEditingTaskId(task.id);
  }, [addTask, selectTask, setEditingTaskId]);

  const handleAddGroup = useCallback(async () => {
    await addGroup();
  }, [addGroup]);

  return (
    <div className="flex flex-col h-full">
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
      <div className="flex-1 overflow-y-auto">
        {/* Ungrouped tasks first */}
        {ungroupedTasks.map((task) => (
          <SidebarTaskRow key={task.id} task={task} indented={false} />
        ))}

        {/* Groups with their children */}
        {sortedGroups.map((group) => {
          const children = groupedTasks.get(group.id) ?? [];
          return (
            <div key={group.id}>
              <SidebarGroupRow group={group} />
              {!group.collapsed &&
                children.map((task) => (
                  <SidebarTaskRow key={task.id} task={task} indented />
                ))}
            </div>
          );
        })}
      </div>      <SavedIndicator />    </div>
  );
}
