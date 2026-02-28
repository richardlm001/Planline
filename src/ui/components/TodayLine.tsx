import { useMemo } from 'react';
import { todayDayIndex } from '../../domain/constants';
import { HEADER_HEIGHT } from '../constants';

interface TodayLineProps {
  dayToPixel: (dayIndex: number) => number;
}

export function TodayLine({ dayToPixel }: TodayLineProps) {
  const today = useMemo(() => todayDayIndex(), []);
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
