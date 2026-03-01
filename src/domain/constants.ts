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
  '#C8D9FA', // pastel blue
  '#B8E8D5', // pastel mint
  '#FAE6A8', // pastel yellow
  '#F7C5C5', // pastel coral
  '#D6C8F7', // pastel lavender
  '#F5C6DD', // pastel pink
  '#B8E8EE', // pastel cyan
  '#F7D6B3', // pastel peach
  '#B8E4D8', // pastel teal
  '#C5C7F5', // pastel indigo
];

/** Default values for new entities */
export const DEFAULTS = {
  projectName: 'Project 01',
  projectId: 'default',
  taskName: 'New task',
  taskDuration: 3,
} as const;
