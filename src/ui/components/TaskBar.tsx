import { useRef, useState, useCallback, memo } from 'react';
import type { Task } from '../../domain/types';
import { useProjectStore } from '../../store/useProjectStore';
import { ROW_HEIGHT } from '../constants';

interface TaskBarProps {
  task: Task;
  computedStart: number;
  columnWidth: number;
  rowIndex: number;
  rangeStartDayIndex: number;
  pixelsPerDay: number;
  dayToPixel: (dayIndex: number) => number;
  totalRows: number;
  onVerticalDrop?: (taskId: string, targetRowIndex: number) => void;
}

export const BAR_HEIGHT = 28;
const BAR_VERTICAL_PADDING = (ROW_HEIGHT - BAR_HEIGHT) / 2;
const RESIZE_HANDLE_WIDTH = 8;
const DRAG_DIRECTION_THRESHOLD = 5; // pixels before deciding direction

export const TaskBar = memo(function TaskBar({
  task,
  computedStart,
  rowIndex,
  pixelsPerDay,
  dayToPixel,
  totalRows,
  onVerticalDrop,
}: TaskBarProps) {
  const updateTask = useProjectStore((s) => s.updateTask);
  const selectTask = useProjectStore((s) => s.selectTask);
  const isSelected = useProjectStore((s) => s.selectedTaskIds.includes(task.id));
  const isLinking = useProjectStore((s) => s.linkingFromTaskId !== null);
  const linkingFromTaskId = useProjectStore((s) => s.linkingFromTaskId);
  const setLinkingFromTaskId = useProjectStore((s) => s.setLinkingFromTaskId);
  const addDependency = useProjectStore((s) => s.addDependency);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verticalDragRow, setVerticalDragRow] = useState<number | null>(null);
  const [isVerticalDrag, setIsVerticalDrag] = useState(false);
  const [resizeDelta, setResizeDelta] = useState(0);
  const [resizeEdge, setResizeEdge] = useState<'left' | 'right' | null>(null);

  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const originalStart = useRef(computedStart);
  const dragDirectionDecided = useRef(false);

  const effectiveStart = computedStart + (isDragging && !isVerticalDrag ? Math.round(dragOffset / pixelsPerDay) : 0);

  // Compute display values accounting for resize
  let displayStart = effectiveStart;
  let displayDuration = task.durationDays;

  if (resizeEdge === 'right') {
    displayDuration = Math.max(1, task.durationDays + Math.round(resizeDelta / pixelsPerDay));
  } else if (resizeEdge === 'left') {
    const daysDelta = Math.round(resizeDelta / pixelsPerDay);
    const newDuration = Math.max(1, task.durationDays - daysDelta);
    const actualDelta = task.durationDays - newDuration;
    displayStart = computedStart + actualDelta;
    displayDuration = newDuration;
  }

  const left = dayToPixel(displayStart);
  const width = displayDuration * pixelsPerDay;
  const displayTop = isVerticalDrag && verticalDragRow !== null
    ? verticalDragRow * ROW_HEIGHT + BAR_VERTICAL_PADDING
    : rowIndex * ROW_HEIGHT + BAR_VERTICAL_PADDING;

  // --- Move drag handlers ---
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't start drag if clicking on a resize handle
    const target = e.target as HTMLElement;
    if (target.dataset.resizeHandle) return;

    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    originalStart.current = computedStart;
    dragDirectionDecided.current = false;
    setIsDragging(true);
    setIsVerticalDrag(false);
    setDragOffset(0);
    setVerticalDragRow(null);
    selectTask(task.id, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey });
  }, [computedStart, selectTask, task.id]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;

    if (!dragDirectionDecided.current) {
      if (Math.abs(dx) >= DRAG_DIRECTION_THRESHOLD || Math.abs(dy) >= DRAG_DIRECTION_THRESHOLD) {
        dragDirectionDecided.current = true;
        if (Math.abs(dy) > Math.abs(dx)) {
          setIsVerticalDrag(true);
        }
      }
      return;
    }

    if (isVerticalDrag) {
      // Compute target row from Y offset
      const targetRow = Math.max(0, Math.min(totalRows - 1, Math.round((rowIndex * ROW_HEIGHT + dy) / ROW_HEIGHT)));
      setVerticalDragRow(targetRow);
    } else {
      setDragOffset(dx);
    }
  }, [isDragging, isVerticalDrag, rowIndex, totalRows]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (isVerticalDrag && verticalDragRow !== null && verticalDragRow !== rowIndex) {
        onVerticalDrop?.(task.id, verticalDragRow);
      } else if (!isVerticalDrag) {
        const daysDelta = Math.round((e.clientX - dragStartX.current) / pixelsPerDay);
        if (daysDelta !== 0) {
          const newStart = computedStart + daysDelta;
          updateTask(task.id, { startDayIndex: newStart });
        }
      }

      setIsDragging(false);
      setIsVerticalDrag(false);
      setDragOffset(0);
      setVerticalDragRow(null);
      dragDirectionDecided.current = false;
    }
  }, [isDragging, isVerticalDrag, verticalDragRow, rowIndex, pixelsPerDay, task.id, computedStart, updateTask, onVerticalDrop]);

  // --- Resize handlers ---
  const handleResizePointerDown = useCallback((e: React.PointerEvent, edge: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    setResizeEdge(edge);
    setResizeDelta(0);
    selectTask(task.id, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey });
  }, [selectTask, task.id]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (resizeEdge) {
      setResizeDelta(e.clientX - dragStartX.current);
    }
  }, [resizeEdge]);

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    if (resizeEdge) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      const daysDelta = Math.round((e.clientX - dragStartX.current) / pixelsPerDay);

      if (resizeEdge === 'right') {
        const newDuration = Math.max(1, task.durationDays + daysDelta);
        if (newDuration !== task.durationDays) {
          updateTask(task.id, { durationDays: newDuration });
        }
      } else if (resizeEdge === 'left') {
        const newDuration = Math.max(1, task.durationDays - daysDelta);
        const actualDelta = task.durationDays - newDuration;
        const newStart = task.startDayIndex + actualDelta;
        if (newDuration !== task.durationDays || newStart !== task.startDayIndex) {
          updateTask(task.id, { startDayIndex: newStart, durationDays: newDuration });
        }
      }

      setResizeEdge(null);
      setResizeDelta(0);
    }
  }, [resizeEdge, pixelsPerDay, task.id, task.durationDays, task.startDayIndex, updateTask]);

  // --- Dependency linking handlers ---
  const handleOutputConnectorDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLinkingFromTaskId(task.id);
  }, [setLinkingFromTaskId, task.id]);

  const handleInputConnectorUp = useCallback(async (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (linkingFromTaskId && linkingFromTaskId !== task.id) {
      await addDependency(linkingFromTaskId, task.id);
      setLinkingFromTaskId(null);
    }
  }, [linkingFromTaskId, task.id, addDependency, setLinkingFromTaskId]);

  return (
    <div
      className={`absolute rounded-md shadow-sm border flex items-center text-xs text-white font-medium select-none group ${
        isDragging ? 'cursor-grabbing opacity-80' : 'cursor-grab'
      } ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-black/10'}`}
      style={{
        left,
        width,
        top: displayTop,
        height: BAR_HEIGHT,
        backgroundColor: task.color,
        zIndex: isDragging ? 50 : undefined,
      }}
      title={task.name}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      data-testid={`task-bar-${task.id}`}
    >
      {/* Left connector (input) */}
      <div
        className={`absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-gray-400 z-20 cursor-crosshair transition-opacity ${
          isLinking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onPointerUp={handleInputConnectorUp}
        data-testid={`connector-in-${task.id}`}
      />

      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 h-full cursor-col-resize z-10"
        style={{ width: RESIZE_HANDLE_WIDTH }}
        data-resize-handle="left"
        onPointerDown={(e) => handleResizePointerDown(e, 'left')}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />

      <span className="truncate px-2 pointer-events-none">{task.name}</span>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 h-full cursor-col-resize z-10"
        style={{ width: RESIZE_HANDLE_WIDTH }}
        data-resize-handle="right"
        onPointerDown={(e) => handleResizePointerDown(e, 'right')}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      />

      {/* Right connector (output) */}
      <div
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500 z-20 cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"
        onPointerDown={handleOutputConnectorDown}
        data-testid={`connector-out-${task.id}`}
      />
    </div>
  );
});
