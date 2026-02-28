import { useState, useRef, useEffect } from 'react';
import { COLOR_PALETTE } from '../../domain/constants';
import { useProjectStore } from '../../store/useProjectStore';

interface ColorPickerProps {
  taskId: string;
  currentColor: string;
}

export function ColorPicker({ taskId, currentColor }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateTask = useProjectStore((s) => s.updateTask);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        className="w-3.5 h-3.5 rounded-full border border-white/50 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-white/50"
        style={{ backgroundColor: currentColor }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        data-testid={`color-trigger-${taskId}`}
        title="Change color"
      />
      {isOpen && (
        <div
          className="absolute z-50 top-5 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 grid grid-cols-5 gap-1"
          data-testid={`color-picker-${taskId}`}
        >
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-[8px] ${
                color === currentColor ? 'border-gray-800' : 'border-transparent'
              } hover:scale-110 transition-transform`}
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.stopPropagation();
                updateTask(taskId, { color });
                setIsOpen(false);
              }}
              data-testid={`color-swatch-${color}`}
            >
              {color === currentColor ? '✓' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
