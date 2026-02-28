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

/** Curated color palette for task bars */
export const COLOR_PALETTE = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];

/** Default values for new entities */
export const DEFAULTS = {
  projectName: 'Project 01',
  projectId: 'default',
  taskName: 'New task',
  taskDuration: 3,
} as const;
