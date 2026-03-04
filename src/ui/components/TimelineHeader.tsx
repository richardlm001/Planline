import { useMemo } from 'react';
import { format } from 'date-fns';
import { dayIndexToDate } from '../../domain/constants';
import { HEADER_HEIGHT } from '../constants';
import type { ZoomLevel } from '../constants';
import type { TimelineColumn } from './Timeline';

interface MonthSpan {
  label: string;
  colCount: number;
}

interface TimelineHeaderProps {
  columns: TimelineColumn[];
  columnWidth: number;
  viewMode: ZoomLevel;
}

export function TimelineHeader({ columns, columnWidth, viewMode }: TimelineHeaderProps) {
  // Adapt font size to column width
  const isNarrow = columnWidth <= 25;
  const textClass = isNarrow ? 'text-[9px]' : 'text-xs';
  const sublabelClass = isNarrow ? 'text-[8px]' : 'text-[10px]';

  // For day view, compute month spans for the top row
  const monthSpans = useMemo((): MonthSpan[] => {
    if (viewMode !== 'day' || columns.length === 0) return [];
    const spans: MonthSpan[] = [];
    let currentLabel = '';
    let count = 0;
    for (const col of columns) {
      const date = dayIndexToDate(col.dayIndex);
      const label = columnWidth >= 60
        ? format(date, 'MMMM yyyy')
        : format(date, 'MMM yyyy');
      if (label === currentLabel) {
        count++;
      } else {
        if (count > 0) spans.push({ label: currentLabel, colCount: count });
        currentLabel = label;
        count = 1;
      }
    }
    if (count > 0) spans.push({ label: currentLabel, colCount: count });
    return spans;
  }, [columns, viewMode, columnWidth]);

  const showMonthRow = viewMode === 'day';
  const monthRowHeight = showMonthRow ? 20 : 0;
  const dayRowHeight = HEADER_HEIGHT - monthRowHeight;

  return (
    <div
      className="sticky top-0 z-10 bg-white border-b border-gray-200 flex flex-col"
      style={{ height: HEADER_HEIGHT }}
    >
      {/* Month spanning row (day view only) */}
      {showMonthRow && (
        <div className="flex flex-shrink-0 border-b border-gray-100" style={{ height: monthRowHeight }}>
          {monthSpans.map((span, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-gray-400 border-r border-gray-200"
              style={{ width: span.colCount * columnWidth }}
            >
              <span className="truncate px-1">{span.label}</span>
            </div>
          ))}
        </div>
      )}
      {/* Day / week / month columns row */}
      <div className="flex flex-1 min-h-0">
        {columns.map((col) => (
          <div
            key={col.dayIndex}
            className={`flex-shrink-0 flex flex-col items-center justify-center ${textClass} border-r border-gray-100 overflow-hidden ${
              col.isToday ? 'bg-blue-100 font-bold text-blue-600' : col.isWeekend ? 'bg-gray-50 text-gray-400' : 'text-gray-600'
            }`}
            style={{ width: columnWidth }}
          >
            <span className="truncate w-full text-center px-0.5">{col.label}</span>
            {col.sublabel && <span className={`${sublabelClass} truncate w-full text-center px-0.5`}>{col.sublabel}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
