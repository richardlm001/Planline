import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineHeader } from '../TimelineHeader';
import type { TimelineColumn } from '../Timeline';

describe('TimelineHeader', () => {
  it('renders day sublabels', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '1', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
      { dayIndex: 1, label: '2', sublabel: 'Tue', isWeekend: false, isToday: false, daysSpan: 1 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={40} />);
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
  });

  it('renders week labels without sublabels', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: 'Jan 1–7', isWeekend: false, isToday: false, daysSpan: 7 },
      { dayIndex: 7, label: 'Jan 8–14', isWeekend: false, isToday: false, daysSpan: 7 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={40} />);
    expect(screen.getByText('Jan 1–7')).toBeTruthy();
    expect(screen.getByText('Jan 8–14')).toBeTruthy();
  });

  it('renders month labels', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: 'Jan 2024', isWeekend: false, isToday: false, daysSpan: 31 },
      { dayIndex: 31, label: 'Feb 2024', isWeekend: false, isToday: false, daysSpan: 29 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={60} />);
    expect(screen.getByText('Jan 2024')).toBeTruthy();
    expect(screen.getByText('Feb 2024')).toBeTruthy();
  });

  it('applies weekend shading to weekend columns', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '6', sublabel: 'Sat', isWeekend: true, isToday: false, daysSpan: 1 },
      { dayIndex: 1, label: '7', sublabel: 'Sun', isWeekend: true, isToday: false, daysSpan: 1 },
      { dayIndex: 2, label: '8', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
    ];
    const { container } = render(<TimelineHeader columns={columns} columnWidth={40} />);
    const weekendDivs = container.querySelectorAll('[class*="bg-gray-50"]');
    expect(weekendDivs.length).toBe(2);
  });

  it('highlights today column', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '1', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
      { dayIndex: 1, label: '2', sublabel: 'Tue', isWeekend: false, isToday: true, daysSpan: 1 },
    ];
    const { container } = render(<TimelineHeader columns={columns} columnWidth={40} />);
    const todayDivs = container.querySelectorAll('[class*="text-blue-600"]');
    expect(todayDivs.length).toBeGreaterThanOrEqual(1);
  });

  it('sets correct column widths', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '1', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
    ];
    const { container } = render(<TimelineHeader columns={columns} columnWidth={60} />);
    const col = container.querySelector('[style*="width"]') as HTMLElement;
    expect(col.style.width).toBe('60px');
  });
});
