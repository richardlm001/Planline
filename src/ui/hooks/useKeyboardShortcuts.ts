import { useEffect, useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';

export function useKeyboardShortcuts() {
  const tasks = useProjectStore((s) => s.tasks);
  const selectedTaskId = useProjectStore((s) => s.selectedTaskId);
  const editingTaskId = useProjectStore((s) => s.editingTaskId);
  const selectTask = useProjectStore((s) => s.selectTask);
  const addTask = useProjectStore((s) => s.addTask);
  const removeTask = useProjectStore((s) => s.removeTask);
  const addDependency = useProjectStore((s) => s.addDependency);
  const setEditingTaskId = useProjectStore((s) => s.setEditingTaskId);

  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      const isInputFocused = tag === 'INPUT' || tag === 'TEXTAREA';

      // Allow Escape everywhere
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editingTaskId) {
          setEditingTaskId(null);
        } else {
          selectTask(null);
        }
        return;
      }

      // Don't intercept shortcuts when editing text (except Enter handled by the input itself)
      if (isInputFocused) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (sortedTasks.length === 0) return;
        if (!selectedTaskId) {
          selectTask(sortedTasks[0].id);
        } else {
          const idx = sortedTasks.findIndex((t) => t.id === selectedTaskId);
          if (idx < sortedTasks.length - 1) {
            selectTask(sortedTasks[idx + 1].id);
          }
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (sortedTasks.length === 0) return;
        if (!selectedTaskId) {
          selectTask(sortedTasks[sortedTasks.length - 1].id);
        } else {
          const idx = sortedTasks.findIndex((t) => t.id === selectedTaskId);
          if (idx > 0) {
            selectTask(sortedTasks[idx - 1].id);
          }
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTaskId) {
          e.preventDefault();
          await removeTask(selectedTaskId);
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        // Insert after selected task if one is selected
        const selectedIdx = selectedTaskId
          ? sortedTasks.findIndex((t) => t.id === selectedTaskId)
          : -1;
        const insertSortOrder =
          selectedIdx >= 0 ? sortedTasks[selectedIdx].sortOrder + 0.5 : undefined;

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

            const newTask = await addTask({
              startDayIndex: childStart,
              sortOrder: selectedTask.sortOrder + 0.5,
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
      sortedTasks,
      selectedTaskId,
      editingTaskId,
      selectTask,
      addTask,
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
