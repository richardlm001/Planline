import { useState, useRef, useEffect, useCallback } from 'react';
import type { Task } from '../../domain/types';
import { useProjectStore } from '../../store/useProjectStore';
import { ColorPicker } from './ColorPicker';
import { ROW_HEIGHT } from '../constants';

interface SidebarTaskRowProps {
  task: Task;
  indented?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export function SidebarTaskRow({ task, indented = false, onDragStart, onDragOver, onDrop, isDragOver = false }: SidebarTaskRowProps) {
  const selectedTaskIds = useProjectStore((s) => s.selectedTaskIds);
  const editingTaskId = useProjectStore((s) => s.editingTaskId);
  const selectTask = useProjectStore((s) => s.selectTask);
  const updateTask = useProjectStore((s) => s.updateTask);
  const setEditingTaskId = useProjectStore((s) => s.setEditingTaskId);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSelected = selectedTaskIds.includes(task.id);

  const startEditing = useCallback(() => {
    setEditValue(task.name);
    setIsEditing(true);
  }, [task.name]);

  const saveEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.name) {
      updateTask(task.id, { name: trimmed });
    }
    setIsEditing(false);
    setEditingTaskId(null);
  }, [editValue, task.id, task.name, updateTask, setEditingTaskId]);

  const cancelEdit = useCallback(() => {
    setEditValue(task.name);
    setIsEditing(false);
    setEditingTaskId(null);
  }, [task.name, setEditingTaskId]);

  // Auto-enter edit mode when store signals this task should be edited
  useEffect(() => {
    if (editingTaskId === task.id && !isEditing) {
      // Use a microtask to avoid setState-in-effect lint warning
      queueMicrotask(() => startEditing());
    }
  }, [editingTaskId, task.id, isEditing, startEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === 'F2' && !isEditing) {
      e.preventDefault();
      startEditing();
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent) => {
    onDragStart?.(e, task.id);
  }, [onDragStart, task.id]);

  return (
    <div
      className={`flex items-center cursor-pointer select-none text-sm border-b border-gray-100 ${
        isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-100'
      } ${isDragOver ? 'border-t-2 border-t-blue-500' : ''}`}
      style={{ height: ROW_HEIGHT, paddingLeft: indented ? 28 : 12, paddingRight: 12 }}
      onClick={(e) => selectTask(task.id, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey })}
      onDoubleClick={startEditing}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid={`task-row-${task.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag handle */}
      <div className="flex-shrink-0 cursor-grab text-gray-300 hover:text-gray-500 mr-1 text-xs select-none" data-testid={`drag-handle-${task.id}`}>
        ⠿
      </div>
      <ColorPicker taskId={task.id} currentColor={task.color} />
      <div className="w-1 flex-shrink-0" />
      {isEditing ? (
        <input
          ref={inputRef}
          className="flex-1 bg-white border border-blue-300 rounded px-1 py-0.5 text-sm outline-none"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="truncate">{task.name}</span>
      )}
    </div>
  );
}

// Expose editing trigger for external use (e.g., after creating a task)
SidebarTaskRow.displayName = 'SidebarTaskRow';
