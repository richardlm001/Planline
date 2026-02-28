import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';

export function ProjectHeader() {
  const project = useProjectStore((s) => s.project);
  const updateProject = useProjectStore((s) => s.updateProject);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    setEditValue(project.name);
    setIsEditing(true);
  }, [project.name]);

  const saveEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== project.name) {
      updateProject({ name: trimmed });
    }
    setIsEditing(false);
  }, [editValue, project.name, updateProject]);

  const cancelEdit = useCallback(() => {
    setEditValue(project.name);
    setIsEditing(false);
  }, [project.name]);

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
    <div className="flex items-center" data-testid="project-header">
      {isEditing ? (
        <input
          ref={inputRef}
          className="bg-white border border-blue-300 rounded px-1.5 py-0.5 text-sm font-semibold text-gray-800 outline-none"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          data-testid="project-name-input"
        />
      ) : (
        <span
          className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={startEditing}
          data-testid="project-name"
        >
          {project.name}
        </span>
      )}
    </div>
  );
}
