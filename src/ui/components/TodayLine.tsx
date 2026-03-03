import { useState, useEffect } from 'react';
import { todayDayIndex } from '../../domain/constants';
import {
  HEADER_HEIGHT,
  WORKING_HOURS_START,
  WORKING_HOURS_END,
  TODAY_LINE_UPDATE_INTERVAL_MS,
} from '../constants';

/**
 * Compute the fraction of the working day elapsed (0–1).
 * Before WORKING_HOURS_START → 0, after WORKING_HOURS_END → 1.
 */
export function workingDayFraction(now: Date): number {
  const hours = now.getHours() + now.getMinutes() / 60;
  if (hours <= WORKING_HOURS_START) return 0;
  if (hours >= WORKING_HOURS_END) return 1;
  return (hours - WORKING_HOURS_START) / (WORKING_HOURS_END - WORKING_HOURS_START);
}

function useTodayPosition(): { dayIndex: number; fraction: number } {
  const [pos, setPos] = useState(() => ({
    dayIndex: todayDayIndex(),
    fraction: workingDayFraction(new Date()),
  }));

  useEffect(() => {
    const update = () =>
      setPos({
        dayIndex: todayDayIndex(),
        fraction: workingDayFraction(new Date()),
      });

    // Recalculate on window focus
    window.addEventListener('focus', update);

    // Recalculate every 30 minutes
    const interval = setInterval(update, TODAY_LINE_UPDATE_INTERVAL_MS);

    // Recalculate at next midnight (day change)
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const midnightTimer = setTimeout(update, msUntilMidnight);

    return () => {
      window.removeEventListener('focus', update);
      clearInterval(interval);
      clearTimeout(midnightTimer);
    };
  }, [pos.dayIndex]);

  return pos;
}

interface TodayLineProps {
  dayToPixel: (dayIndex: number) => number;
}

export function TodayLine({ dayToPixel }: TodayLineProps) {
  const { dayIndex, fraction } = useTodayPosition();
  const dayStart = dayToPixel(dayIndex);
  const dayEnd = dayToPixel(dayIndex + 1);
  const left = dayStart + fraction * (dayEnd - dayStart);

  return (
    <div
      className="absolute z-0 pointer-events-none"
      style={{
        left,
        top: 0,
        width: 2,
        height: '100%',
        minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
      }}
      data-testid="today-line"
    />
  );
}
