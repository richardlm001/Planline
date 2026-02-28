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
export const VISIBLE_DAYS = 90;
