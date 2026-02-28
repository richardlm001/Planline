export type ZoomLevel = 'day' | 'week' | 'month';

export interface ZoomConfig {
  columnWidth: number;
  daysPerColumn: number;
}

export const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  day: { columnWidth: 40, daysPerColumn: 1 },
  week: { columnWidth: 40, daysPerColumn: 7 },
  month: { columnWidth: 60, daysPerColumn: 30 },
};

export const SIDEBAR_WIDTH = 260;
export const ROW_HEIGHT = 40;
export const HEADER_HEIGHT = 48;
export const BASE_VISIBLE_DAYS = 90;

/** Compute the number of visible days needed to fill the viewport at a given zoom level */
export function getVisibleDays(zoomLevel: ZoomLevel, viewportWidth?: number): number {
  const config = ZOOM_CONFIGS[zoomLevel];
  const vpWidth = viewportWidth ?? 1920; // sensible default for SSR / first render
  // How many days the viewport can physically display
  const pixelsPerDay = config.columnWidth / config.daysPerColumn;
  const daysInViewport = Math.ceil(vpWidth / pixelsPerDay);
  // Use whichever is larger: the base range or what's needed to fill the screen, plus buffer
  return Math.max(BASE_VISIBLE_DAYS, daysInViewport + 60);
}
