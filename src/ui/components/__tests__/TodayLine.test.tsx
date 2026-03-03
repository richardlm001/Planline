import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TodayLine, workingDayFraction } from '../TodayLine';
import { todayDayIndex } from '../../../domain/constants';
import { WORKING_HOURS_START, WORKING_HOURS_END } from '../../constants';

describe('TodayLine', () => {
  it('renders within the correct day column', () => {
    const today = todayDayIndex();
    const rangeStart = today - 10;
    const columnWidth = 40;

    const dayToPixel = (dayIndex: number) => (dayIndex - rangeStart) * columnWidth;

    const { getByTestId } = render(
      <TodayLine dayToPixel={dayToPixel} />
    );

    const line = getByTestId('today-line');
    const leftPx = parseFloat(line.style.left);
    const dayStartPx = (today - rangeStart) * columnWidth;
    const dayEndPx = (today - rangeStart + 1) * columnWidth;
    expect(leftPx).toBeGreaterThanOrEqual(dayStartPx);
    expect(leftPx).toBeLessThanOrEqual(dayEndPx);
  });
});

describe('workingDayFraction', () => {
  it('returns 0 before working hours start', () => {
    const early = new Date(2026, 2, 3, WORKING_HOURS_START - 1, 0); // 1 hour before start
    expect(workingDayFraction(early)).toBe(0);
  });

  it('returns 0 at exactly working hours start', () => {
    const start = new Date(2026, 2, 3, WORKING_HOURS_START, 0);
    expect(workingDayFraction(start)).toBe(0);
  });

  it('returns 1 after working hours end', () => {
    const late = new Date(2026, 2, 3, WORKING_HOURS_END + 1, 0);
    expect(workingDayFraction(late)).toBe(1);
  });

  it('returns 1 at exactly working hours end', () => {
    const end = new Date(2026, 2, 3, WORKING_HOURS_END, 0);
    expect(workingDayFraction(end)).toBe(1);
  });

  it('returns 0.5 at midpoint of working hours', () => {
    const midHour = (WORKING_HOURS_START + WORKING_HOURS_END) / 2;
    const mid = new Date(2026, 2, 3, Math.floor(midHour), (midHour % 1) * 60);
    expect(workingDayFraction(mid)).toBeCloseTo(0.5);
  });

  it('returns proportional fraction for arbitrary time', () => {
    // 2 hours into a 9-hour working day (8–17) → 2/9
    const twoHoursIn = new Date(2026, 2, 3, WORKING_HOURS_START + 2, 0);
    const expected = 2 / (WORKING_HOURS_END - WORKING_HOURS_START);
    expect(workingDayFraction(twoHoursIn)).toBeCloseTo(expected);
  });

  it('accounts for minutes within the hour', () => {
    // 8:30 → 0.5 hours into 9-hour day → 0.5/9
    const halfHourIn = new Date(2026, 2, 3, WORKING_HOURS_START, 30);
    const expected = 0.5 / (WORKING_HOURS_END - WORKING_HOURS_START);
    expect(workingDayFraction(halfHourIn)).toBeCloseTo(expected);
  });
});
