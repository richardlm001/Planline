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
    render(<TimelineHeader columns={columns} columnWidth={40} viewMode="day" />);
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
  });

  it('renders month group row for day view', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '1', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
      { dayIndex: 1, label: '2', sublabel: 'Tue', isWeekend: false, isToday: false, daysSpan: 1 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={40} viewMode="day" />);
    expect(screen.getByText('Jan 2024')).toBeTruthy();
  });

  it('renders week view with month group and simplified labels', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: 'Jan 1–7', isWeekend: false, isToday: false, daysSpan: 7 },
      { dayIndex: 7, label: 'Jan 8–14', isWeekend: false, isToday: false, daysSpan: 7 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={40} viewMode="week" />);
    // Top row: month group
    expect(screen.getByText('Jan 2024')).toBeTruthy();
    // Bottom row: simplified day numbers (columnWidth < 60)
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
  });

  it('renders week view wide columns with day ranges', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: 'Jan 1–7', isWeekend: false, isToday: false, daysSpan: 7 },
      { dayIndex: 7, label: 'Jan 8–14', isWeekend: false, isToday: false, daysSpan: 7 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={80} viewMode="week" />);
    // Top row: full month name (columnWidth >= 60)
    expect(screen.getByText('January 2024')).toBeTruthy();
    // Bottom row: day range (columnWidth >= 60)
    expect(screen.getByText('1\u20137')).toBeTruthy();
    expect(screen.getByText('8\u201314')).toBeTruthy();
  });

  it('renders month view with year group and month labels', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: 'Jan 2024', isWeekend: false, isToday: false, daysSpan: 31 },
      { dayIndex: 31, label: 'Feb 2024', isWeekend: false, isToday: false, daysSpan: 29 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={60} viewMode="month" />);
    // Top row: year group
    expect(screen.getByText('2024')).toBeTruthy();
    // Bottom row: abbreviated month name (columnWidth >= 45 but < 80)
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Feb')).toBeTruthy();
  });

  it('renders month view wide columns with full month names', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: 'January 2024', isWeekend: false, isToday: false, daysSpan: 31 },
      { dayIndex: 31, label: 'February 2024', isWeekend: false, isToday: false, daysSpan: 29 },
    ];
    render(<TimelineHeader columns={columns} columnWidth={120} viewMode="month" />);
    // Top row: year group
    expect(screen.getByText('2024')).toBeTruthy();
    // Bottom row: full month name (columnWidth >= 80)
    expect(screen.getByText('January')).toBeTruthy();
    expect(screen.getByText('February')).toBeTruthy();
  });

  it('applies weekend shading to weekend columns', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '6', sublabel: 'Sat', isWeekend: true, isToday: false, daysSpan: 1 },
      { dayIndex: 1, label: '7', sublabel: 'Sun', isWeekend: true, isToday: false, daysSpan: 1 },
      { dayIndex: 2, label: '8', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
    ];
    const { container } = render(<TimelineHeader columns={columns} columnWidth={40} viewMode="day" />);
    const weekendDivs = container.querySelectorAll('[class*="bg-gray-50"]');
    expect(weekendDivs.length).toBe(2);
  });

  it('highlights today column', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '1', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
      { dayIndex: 1, label: '2', sublabel: 'Tue', isWeekend: false, isToday: true, daysSpan: 1 },
    ];
    const { container } = render(<TimelineHeader columns={columns} columnWidth={40} viewMode="day" />);
    const todayDivs = container.querySelectorAll('[class*="text-blue-600"]');
    expect(todayDivs.length).toBeGreaterThanOrEqual(1);
  });

  it('sets correct column widths', () => {
    const columns: TimelineColumn[] = [
      { dayIndex: 0, label: '1', sublabel: 'Mon', isWeekend: false, isToday: false, daysSpan: 1 },
    ];
    const { container } = render(<TimelineHeader columns={columns} columnWidth={60} viewMode="day" />);
    const col = container.querySelector('[style*="width"]') as HTMLElement;
    expect(col.style.width).toBe('60px');
  });
});
