import { differenceInCalendarDays, addDays } from 'date-fns';

/** The fixed project epoch from which all day indices are calculated */
export const PROJECT_EPOCH = new Date('2024-01-01T00:00:00');

/** Convert a Date to a day index relative to PROJECT_EPOCH */
export function dateToDayIndex(date: Date): number {
  return differenceInCalendarDays(date, PROJECT_EPOCH);
}

/** Convert a day index back to a Date */
export function dayIndexToDate(dayIndex: number): Date {
  return addDays(PROJECT_EPOCH, dayIndex);
}

/** Get today's day index */
export function todayDayIndex(): number {
  return dateToDayIndex(new Date());
}

/** Curated color palette for task bars (soft/pastel tones) */
export const COLOR_PALETTE = [
  '#93B5F7', // soft blue
  '#7DD3B6', // soft emerald
  '#FCD077', // soft amber
  '#F9A8A8', // soft coral
  '#BFA8F7', // soft violet
  '#F4A8CC', // soft pink
  '#7DD8E8', // soft cyan
  '#FCBB7D', // soft orange
  '#7DD3C4', // soft teal
  '#A5A7F5', // soft indigo
];

/** Default values for new entities */
export const DEFAULTS = {
  projectName: 'Project 01',
  projectId: 'default',
  taskName: 'New task',
  taskDuration: 3,
} as const;
