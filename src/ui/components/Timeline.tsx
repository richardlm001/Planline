import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { format, isWeekend, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns';
import { todayDayIndex, dayIndexToDate, dateToDayIndex } from '../../domain/constants';
import { useProjectStore } from '../../store/useProjectStore';
import { TimelineHeader } from './TimelineHeader';
import { TimelineBody } from './TimelineBody';
import { TodayLine } from './TodayLine';
import { LinkingLine } from './LinkingLine';
import { ZOOM_CONFIGS, HEADER_HEIGHT, TOOLBAR_HEIGHT, getVisibleDays } from '../constants';

function useTodayIndex(): number {
  const [today, setToday] = useState(() => todayDayIndex());

  useEffect(() => {
    const handleFocus = () => setToday(todayDayIndex());
    window.addEventListener('focus', handleFocus);

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      setToday(todayDayIndex());
    }, msUntilMidnight);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}

export interface TimelineColumn {
  dayIndex: number; // start day index of this column
  label: string;
  sublabel?: string;
  isWeekend: boolean;
  isToday: boolean;
  daysSpan: number; // how many calendar days this column represents
}

interface TimelineProps {
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  sidebarWidth?: number;
}

export function Timeline({ scrollRef: scrollRefProp, sidebarWidth = 250 }: TimelineProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = scrollRefProp ?? internalRef;
  const zoomLevel = useProjectStore((s) => s.zoomLevel);
  const clearSelection = useProjectStore((s) => s.clearSelection);
  const zoomConfig = ZOOM_CONFIGS[zoomLevel];
  const columnWidth = zoomConfig.columnWidth;

  const today = useTodayIndex();

  // Measure container width for dynamic visible-days calculation
  const [containerWidth, setContainerWidth] = useState(1920);
  useEffect(() => {
    if (scrollRef.current) {
      setContainerWidth(scrollRef.current.clientWidth - sidebarWidth);
    }
    const handleResize = () => {
      if (scrollRef.current) {
        setContainerWidth(scrollRef.current.clientWidth - sidebarWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleDays = useMemo(
    () => getVisibleDays(zoomLevel, containerWidth),
    [zoomLevel, containerWidth]
  );

  // Generate columns based on zoom level
  const columns = useMemo((): TimelineColumn[] => {
    if (zoomLevel === 'day') {
      const halfRange = Math.floor(visibleDays / 2);
      const startDayIndex = today - halfRange;
      const cols: TimelineColumn[] = [];
      for (let i = 0; i < visibleDays; i++) {
        const dayIndex = startDayIndex + i;
        const date = dayIndexToDate(dayIndex);
        cols.push({
          dayIndex,
          label: format(date, 'd'),
          sublabel: format(date, 'EEE'),
          isWeekend: isWeekend(date),
          isToday: dayIndex === today,
          daysSpan: 1,
        });
      }
      return cols;
    } else if (zoomLevel === 'week') {
      const halfRange = Math.floor(visibleDays / 2);
      const startDate = startOfWeek(dayIndexToDate(today - halfRange), { weekStartsOn: 1 });
      const endDate = endOfWeek(dayIndexToDate(today + halfRange), { weekStartsOn: 1 });
      const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
      const cols: TimelineColumn[] = [];
      let d = startDate;
      while (dateToDayIndex(d) < dateToDayIndex(startDate) + totalDays) {
        const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
        const dayIdx = dateToDayIndex(d);
        cols.push({
          dayIndex: dayIdx,
          label: `${format(d, 'MMM d')}–${format(weekEnd, 'd')}`,
          isWeekend: false,
          isToday: today >= dayIdx && today <= dateToDayIndex(weekEnd),
          daysSpan: 7,
        });
        d = new Date(weekEnd.getTime());
        d.setDate(d.getDate() + 1);
      }
      return cols;
    } else {
      // Month
      const halfRange = Math.floor(visibleDays / 2);
      const startDate = startOfMonth(dayIndexToDate(today - halfRange));
      const endDate = endOfMonth(dayIndexToDate(today + halfRange));
      const cols: TimelineColumn[] = [];
      let d = startDate;
      while (d <= endDate) {
        const monthEnd = endOfMonth(d);
        const dayIdx = dateToDayIndex(d);
        const span = differenceInCalendarDays(monthEnd, d) + 1;
        cols.push({
          dayIndex: dayIdx,
          label: format(d, 'MMM yyyy'),
          isWeekend: false,
          isToday: today >= dayIdx && today < dayIdx + span,
          daysSpan: span,
        });
        d = new Date(monthEnd.getTime());
        d.setDate(d.getDate() + 1);
      }
      return cols;
    }
  }, [today, zoomLevel, visibleDays]);

  // For day mode, rangeStartDayIndex is first column's dayIndex.
  // For week/month, same — the first column's dayIndex is the start.
  const rangeStartDayIndex = columns[0]?.dayIndex ?? 0;

  // Total width is sum of all column widths (each column has same pixel width regardless of daysSpan)
  const totalWidth = columns.length * columnWidth;

  // pixelsPerDay: how many pixels represent a single calendar day
  // For month zoom, we use an average based on total visible range for drag/resize
  const pixelsPerDay = useMemo(() => {
    if (zoomLevel === 'day') return columnWidth;
    if (zoomLevel === 'week') return columnWidth / 7;
    // Month: calculate from actual total days across all columns
    const totalDays = columns.reduce((sum, col) => sum + col.daysSpan, 0);
    return totalWidth / totalDays;
  }, [zoomLevel, columnWidth, columns, totalWidth]);

  // Compute the day-to-pixel mapping that accounts for variable-length columns (months)
  // For day/week zoom, this is linear. For month, we need column-aware mapping.
  const dayToPixel = useCallback((dayIndex: number): number => {
    if (zoomLevel === 'day' || zoomLevel === 'week') {
      return (dayIndex - rangeStartDayIndex) * pixelsPerDay;
    }
    // Month: find which column this day falls in
    let px = 0;
    for (const col of columns) {
      const colEnd = col.dayIndex + col.daysSpan;
      if (dayIndex < colEnd) {
        const fraction = (dayIndex - col.dayIndex) / col.daysSpan;
        return px + fraction * columnWidth;
      }
      px += columnWidth;
    }
    // Past the last column
    return px;
  }, [zoomLevel, rangeStartDayIndex, pixelsPerDay, columns, columnWidth]);

  const handleCanvasClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const prevZoomRef = useRef(zoomLevel);

  // Scroll so today appears at ~20% from the left edge on mount and when zoom changes
  useEffect(() => {
    if (scrollRef.current) {
      const todayPx = dayToPixel(today);
      const timelineViewport = scrollRef.current.clientWidth - sidebarWidth;
      scrollRef.current.scrollLeft = todayPx - timelineViewport * 0.2;
    }
    prevZoomRef.current = zoomLevel;
  }, [today, dayToPixel, zoomLevel]);

  return (
    <div style={{ width: totalWidth, minHeight: '100%' }} className="relative">
      <TimelineHeader columns={columns} columnWidth={columnWidth} />
      <div className="relative" style={{ marginTop: 0 }} onClick={handleCanvasClick}>
        {/* Grid lines */}
        {columns.map((col, i) => (
          <div
            key={col.dayIndex}
            className={`absolute top-0 bottom-0 border-r ${
              col.isWeekend ? 'bg-gray-50' : ''
            } border-gray-100`}
            style={{
              left: i * columnWidth,
              width: columnWidth,
              height: '100%',
              minHeight: 'calc(100vh - ' + (TOOLBAR_HEIGHT + HEADER_HEIGHT) + 'px)',
            }}
          />
        ))}
        {/* Task bars */}
        <TimelineBody
          columnWidth={columnWidth}
          rangeStartDayIndex={rangeStartDayIndex}
          pixelsPerDay={pixelsPerDay}
          dayToPixel={dayToPixel}
        />

        {/* Today line */}
        <TodayLine dayToPixel={dayToPixel} />

        {/* Linking drag line */}
        <LinkingLine dayToPixel={dayToPixel} scrollContainer={scrollRef.current} sidebarWidth={sidebarWidth} />
      </div>
    </div>
  );
}
