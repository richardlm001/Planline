import { HEADER_HEIGHT } from '../constants';
import type { TimelineColumn } from './Timeline';

interface TimelineHeaderProps {
  columns: TimelineColumn[];
  columnWidth: number;
}

export function TimelineHeader({ columns, columnWidth }: TimelineHeaderProps) {
  return (
    <div
      className="sticky top-0 z-10 bg-white border-b border-gray-200 flex"
      style={{ height: HEADER_HEIGHT }}
    >
      {columns.map((col) => (
        <div
          key={col.dayIndex}
          className={`flex-shrink-0 flex flex-col items-center justify-center text-xs border-r border-gray-100 ${
            col.isWeekend ? 'bg-gray-50 text-gray-400' : 'text-gray-600'
          } ${col.isToday ? 'font-bold text-blue-600' : ''}`}
          style={{ width: columnWidth }}
        >
          <span>{col.label}</span>
          {col.sublabel && <span className="text-[10px]">{col.sublabel}</span>}
        </div>
      ))}
    </div>
  );
}
