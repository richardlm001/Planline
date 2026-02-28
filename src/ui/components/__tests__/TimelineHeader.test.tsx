import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineHeader } from '../TimelineHeader';
import type { TimelineColumn } from '../Timeline';

describe('TimelineHeader', () => {
  it('renders without crashing', () => {
    const columns: TimelineColumn[] = [
      {
        dayIndex: 0,
        label: '1',
        sublabel: 'Mon',
        isWeekend: false,
        isToday: false,
        daysSpan: 1,
      },
      {
        dayIndex: 1,
        label: '2',
        sublabel: 'Tue',
        isWeekend: false,
        isToday: false,
        daysSpan: 1,
      },
    ];

    render(<TimelineHeader columns={columns} columnWidth={40} />);
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
  });
});
