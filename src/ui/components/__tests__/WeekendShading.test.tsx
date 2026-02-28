import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TimelineHeader } from '../TimelineHeader';
import type { TimelineColumn } from '../Timeline';

describe('Weekend Shading', () => {
  it('applies weekend class to weekend columns', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '6', sublabel: 'Sat', isWeekend: true, isToday: false, daysSpan: 1 },
      { dayIndex: 1, label: '7', sublabel: 'Sun', isWeekend: true, isToday: false, daysSpan: 1 },
      { dayIndex: 2, label: '8', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
    ];

    const { container } = render(<TimelineHeader columns={columns} columnWidth={40} />);
    const divs = container.querySelectorAll('[class*="bg-gray-50"]');
    // Saturday and Sunday should have the weekend class
    expect(divs.length).toBe(2);
  });
});
