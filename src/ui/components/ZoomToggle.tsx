import { useProjectStore } from '../../store/useProjectStore';
import type { ZoomLevel } from '../constants';

const levels: { key: ZoomLevel; label: string }[] = [
  { key: 'day', label: 'D' },
  { key: 'week', label: 'W' },
  { key: 'month', label: 'M' },
];

export function ZoomToggle() {
  const zoomLevel = useProjectStore((s) => s.zoomLevel);
  const setZoomLevel = useProjectStore((s) => s.setZoomLevel);

  return (
    <div className="inline-flex rounded border border-gray-300 overflow-hidden text-xs" data-testid="zoom-toggle">
      {levels.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setZoomLevel(key)}
          className={`px-2 py-1 font-medium transition-colors ${
            zoomLevel === key
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          data-testid={`zoom-${key}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
