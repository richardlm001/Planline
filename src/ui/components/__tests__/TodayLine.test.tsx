import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TodayLine } from '../TodayLine';
import { todayDayIndex } from '../../../domain/constants';

describe('TodayLine', () => {
  it('renders at the correct left offset', () => {
    const today = todayDayIndex();
    const rangeStart = today - 10;
    const columnWidth = 40;

    const dayToPixel = (dayIndex: number) => (dayIndex - rangeStart) * columnWidth;

    const { getByTestId } = render(
      <TodayLine dayToPixel={dayToPixel} />
    );

    const line = getByTestId('today-line');
    const expectedLeft = (today - rangeStart) * columnWidth;
    expect(line.style.left).toBe(`${expectedLeft}px`);
  });
});
