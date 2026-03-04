import { useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { ZOOM_PRESETS, MAX_ZOOM_PRESET_INDEX } from '../constants';

export function ZoomToggle() {
  const zoomPresetIndex = useProjectStore((s) => s.zoomPresetIndex);
  const setZoomPresetIndex = useProjectStore((s) => s.setZoomPresetIndex);
  const preset = ZOOM_PRESETS[zoomPresetIndex];

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setZoomPresetIndex(Number(e.target.value));
    },
    [setZoomPresetIndex],
  );

  return (
    <div className="inline-flex items-center gap-2 text-xs" data-testid="zoom-toggle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
        <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z" />
        <path d="M7 9a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 7 9Z" />
      </svg>
      <input
        type="range"
        min={0}
        max={MAX_ZOOM_PRESET_INDEX}
        step={1}
        value={zoomPresetIndex}
        onChange={handleChange}
        className="w-24 h-1 accent-gray-500 cursor-pointer"
        data-testid="zoom-slider"
        aria-label="Zoom level"
      />
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
        <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z" />
        <path d="M7 9a.75.75 0 0 1 .75-.75h.5v-.5a.75.75 0 0 1 1.5 0v.5h.5a.75.75 0 0 1 0 1.5h-.5v.5a.75.75 0 0 1-1.5 0v-.5h-.5A.75.75 0 0 1 7 9Z" />
      </svg>
      <span className="text-gray-500 font-medium w-12" data-testid="zoom-label">
        {preset.label}
      </span>
    </div>
  );
}
