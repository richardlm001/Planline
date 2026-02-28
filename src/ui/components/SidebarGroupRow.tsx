import { useState, useRef, useEffect, useCallback } from 'react';
import type { Group } from '../../domain/types';
import { useProjectStore } from '../../store/useProjectStore';
import { ROW_HEIGHT } from '../constants';

interface SidebarGroupRowProps {
  group: Group;
}

export function SidebarGroupRow({ group }: SidebarGroupRowProps) {
  const updateGroup = useProjectStore((s) => s.updateGroup);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateGroup(group.id, { collapsed: !group.collapsed });
    },
    [group.id, group.collapsed, updateGroup]
  );

  const startEditing = useCallback(() => {
    setEditValue(group.name);
    setIsEditing(true);
  }, [group.name]);

  const saveEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== group.name) {
      updateGroup(group.id, { name: trimmed });
    }
    setIsEditing(false);
  }, [editValue, group.id, group.name, updateGroup]);

  const cancelEdit = useCallback(() => {
    setEditValue(group.name);
    setIsEditing(false);
  }, [group.name]);

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
    }
  };

  return (
    <div
      className="flex items-center px-2 cursor-pointer select-none text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50 hover:bg-gray-100"
      style={{ height: ROW_HEIGHT }}
      onDoubleClick={startEditing}
      data-testid={`group-row-${group.id}`}
    >
      <button
        onClick={toggleCollapse}
        className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-1 flex-shrink-0"
        data-testid={`group-toggle-${group.id}`}
      >
        {group.collapsed ? '▸' : '▾'}
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          className="flex-1 bg-white border border-blue-300 rounded px-1 py-0.5 text-sm outline-none font-normal normal-case tracking-normal"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="truncate">{group.name}</span>
      )}
    </div>
  );
}
