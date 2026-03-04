export type ZoomLevel = 'day' | 'week' | 'month';

export interface ZoomPreset {
  viewMode: ZoomLevel;
  columnWidth: number;
  daysPerColumn: number;
  label: string;
}

/**
 * Single ordered list of zoom presets.
 * Index 0 = most zoomed-in (wide day cells).
 * Last index = most zoomed-out (narrow month columns).
 */
export const ZOOM_PRESETS: ZoomPreset[] = [
  // Day view — 4 sub-levels
  { viewMode: 'day',   columnWidth: 160, daysPerColumn: 1,  label: 'Days' },
  { viewMode: 'day',   columnWidth: 80,  daysPerColumn: 1,  label: 'Days' },
  { viewMode: 'day',   columnWidth: 40,  daysPerColumn: 1,  label: 'Days' },
  { viewMode: 'day',   columnWidth: 20,  daysPerColumn: 1,  label: 'Days' },
  // Week view — 3 sub-levels
  { viewMode: 'week',  columnWidth: 80,  daysPerColumn: 7,  label: 'Weeks' },
  { viewMode: 'week',  columnWidth: 40,  daysPerColumn: 7,  label: 'Weeks' },
  { viewMode: 'week',  columnWidth: 20,  daysPerColumn: 7,  label: 'Weeks' },
  // Month view — 3 sub-levels
  { viewMode: 'month', columnWidth: 120, daysPerColumn: 30, label: 'Months' },
  { viewMode: 'month', columnWidth: 60,  daysPerColumn: 30, label: 'Months' },
  { viewMode: 'month', columnWidth: 30,  daysPerColumn: 30, label: 'Months' },
] as const;

/** Default preset index (standard day view, 40px columns) */
export const DEFAULT_ZOOM_PRESET_INDEX = 2;

/** Maximum valid preset index */
export const MAX_ZOOM_PRESET_INDEX = ZOOM_PRESETS.length - 1;

export const SIDEBAR_WIDTH = 250;
export const MIN_SIDEBAR_WIDTH = 250;
export const MAX_SIDEBAR_WIDTH = 600;
export const ROW_HEIGHT = 40;
export const HEADER_HEIGHT = 48;
export const TOOLBAR_HEIGHT = 37;
export const STATUS_BAR_HEIGHT = 22;
export const BASE_VISIBLE_DAYS = 90;

/** Working hours used to position the today-line within a day column */
export const WORKING_HOURS_START = 8;  // 8 AM
export const WORKING_HOURS_END = 17;   // 5 PM
export const TODAY_LINE_UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/** Compute the number of visible days needed to fill the viewport at a given zoom preset */
export function getVisibleDays(presetIndex: number, viewportWidth?: number): number {
  const config = ZOOM_PRESETS[presetIndex] ?? ZOOM_PRESETS[DEFAULT_ZOOM_PRESET_INDEX];
  const vpWidth = viewportWidth ?? 1920; // sensible default for SSR / first render
  // How many days the viewport can physically display
  const pixelsPerDay = config.columnWidth / config.daysPerColumn;
  const daysInViewport = Math.ceil(vpWidth / pixelsPerDay);
  // Use whichever is larger: the base range or what's needed to fill the screen, plus buffer
  return Math.max(BASE_VISIBLE_DAYS, daysInViewport + 60);
}
