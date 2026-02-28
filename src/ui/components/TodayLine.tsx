import { useMemo, useState, useEffect } from 'react';
import { todayDayIndex } from '../../domain/constants';
import { HEADER_HEIGHT } from '../constants';

function useTodayIndex(): number {
  const [today, setToday] = useState(() => todayDayIndex());

  useEffect(() => {
    // Recalculate on window focus
    const handleFocus = () => setToday(todayDayIndex());
    window.addEventListener('focus', handleFocus);

    // Recalculate at next midnight
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

interface TodayLineProps {
  dayToPixel: (dayIndex: number) => number;
}

export function TodayLine({ dayToPixel }: TodayLineProps) {
  const today = useTodayIndex();
  const left = dayToPixel(today);

  return (
    <div
      className="absolute z-20 pointer-events-none"
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
