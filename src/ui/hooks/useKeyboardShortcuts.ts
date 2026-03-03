import { useEffect, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { buildVisualRowMap } from '../components/layoutUtils';

export function useKeyboardShortcuts() {
  const tasks = useProjectStore((s) => s.tasks);
  const groups = useProjectStore((s) => s.groups);
  const selectedTaskIds = useProjectStore((s) => s.selectedTaskIds);
  const selectedGroupId = useProjectStore((s) => s.selectedGroupId);
  const editingTaskId = useProjectStore((s) => s.editingTaskId);
  const selectTask = useProjectStore((s) => s.selectTask);
  const selectGroup = useProjectStore((s) => s.selectGroup);
  const clearSelection = useProjectStore((s) => s.clearSelection);
  const addTask = useProjectStore((s) => s.addTask);
  const addGroup = useProjectStore((s) => s.addGroup);
  const removeTask = useProjectStore((s) => s.removeTask);
  const addDependency = useProjectStore((s) => s.addDependency);
  const setEditingTaskId = useProjectStore((s) => s.setEditingTaskId);

  const collapsedGroupIds = useMemo(
    () => new Set(groups.filter((g) => g.collapsed).map((g) => g.id)),
    [groups]
  );

  const { rowItems } = useMemo(
    () => buildVisualRowMap(tasks, groups, collapsedGroupIds),
    [tasks, groups, collapsedGroupIds]
  );

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.sortOrder - b.sortOrder),
    [tasks]
  );

  // The "primary" selected task is the last one in the selection (anchor behavior)
  const selectedTaskId = selectedTaskIds.length > 0 ? selectedTaskIds[selectedTaskIds.length - 1] : null;

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      const isInputFocused = tag === 'INPUT' || tag === 'TEXTAREA';

      // Helpers for visual-row navigation
      const findCurrentRowIndex = (): number => {
        if (selectedTaskId) {
          return rowItems.findIndex((r) => r.type === 'task' && r.task.id === selectedTaskId);
        }
        if (selectedGroupId) {
          return rowItems.findIndex((r) => r.type === 'group-header' && r.group.id === selectedGroupId);
        }
        return -1;
      };

      const selectRowItem = (idx: number) => {
        const item = rowItems[idx];
        if (!item) return;
        if (item.type === 'task') {
          selectTask(item.task.id);
        } else {
          selectGroup(item.group.id);
        }
      };

      // Allow Escape everywhere
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editingTaskId) {
          setEditingTaskId(null);
        } else {
          clearSelection();
        }
        return;
      }

      // Don't intercept shortcuts when editing text (except Enter handled by the input itself)
      if (isInputFocused) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rowItems.length === 0) return;
        const currentIdx = findCurrentRowIndex();
        if (currentIdx === -1) {
          // Nothing selected → select first item
          selectRowItem(0);
        } else if (currentIdx < rowItems.length - 1) {
          selectRowItem(currentIdx + 1);
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowItems.length === 0) return;
        const currentIdx = findCurrentRowIndex();
        if (currentIdx === -1) {
          // Nothing selected → select last item
          selectRowItem(rowItems.length - 1);
        } else if (currentIdx > 0) {
          selectRowItem(currentIdx - 1);
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTaskIds.length > 0) {
          e.preventDefault();
          // Delete all selected tasks
          for (const id of [...selectedTaskIds]) {
            await removeTask(id);
          }
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        // Insert after last selected task with midpoint sortOrder
        const selectedIdx = selectedTaskId
          ? sortedTasks.findIndex((t) => t.id === selectedTaskId)
          : -1;
        let insertSortOrder: number | undefined;
        if (selectedIdx >= 0) {
          const currentOrder = sortedTasks[selectedIdx].sortOrder;
          const nextOrder = selectedIdx < sortedTasks.length - 1
            ? sortedTasks[selectedIdx + 1].sortOrder
            : currentOrder + 1;
          insertSortOrder = (currentOrder + nextOrder) / 2;
        }

        if (e.shiftKey) {
          // Shift+Enter creates a new group
          await addGroup(
            insertSortOrder !== undefined ? { sortOrder: insertSortOrder } : undefined
          );
          return;
        }

        const newTask = await addTask(
          insertSortOrder !== undefined ? { sortOrder: insertSortOrder } : undefined
        );
        selectTask(newTask.id);
        setEditingTaskId(newTask.id);
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (selectedTaskId) {
          const selectedTask = sortedTasks.find((t) => t.id === selectedTaskId);
          if (selectedTask) {
            const computedStarts = useProjectStore.getState().computedStarts;
            const parentStart = computedStarts.get(selectedTaskId) ?? selectedTask.startDayIndex;
            const childStart = parentStart + selectedTask.durationDays;

            const selectedIdx = sortedTasks.findIndex((t) => t.id === selectedTaskId);
            const currentOrder = selectedTask.sortOrder;
            const nextOrder = selectedIdx < sortedTasks.length - 1
              ? sortedTasks[selectedIdx + 1].sortOrder
              : currentOrder + 1;
            const insertSortOrder = (currentOrder + nextOrder) / 2;

            const newTask = await addTask({
              startDayIndex: childStart,
              sortOrder: insertSortOrder,
            });
            await addDependency(selectedTaskId, newTask.id);
            selectTask(newTask.id);
            setEditingTaskId(newTask.id);
          }
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        if (selectedTaskId) {
          setEditingTaskId(selectedTaskId);
        }
        return;
      }
    },
    [
      rowItems,
      sortedTasks,
      selectedTaskId,
      selectedTaskIds,
      selectedGroupId,
      editingTaskId,
      selectTask,
      selectGroup,
      clearSelection,
      addTask,
      addGroup,
      removeTask,
      addDependency,
      setEditingTaskId,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
