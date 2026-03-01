import { useCallback, useEffect } from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import {
  factoryReset,
  prefillData,
  clearAllDependencies,
  collapseAllGroups,
  expandAllGroups,
  randomizeTaskColors,
} from './debugActions';

interface DebugModalProps {
  onClose: () => void;
}

export function DebugModal({ onClose }: DebugModalProps) {
  const tasks = useProjectStore((s) => s.tasks);
  const dependencies = useProjectStore((s) => s.dependencies);
  const groups = useProjectStore((s) => s.groups);
  const zoomLevel = useProjectStore((s) => s.zoomLevel);
  const scheduleError = useProjectStore((s) => s.scheduleError);
  const selectedTaskIds = useProjectStore((s) => s.selectedTaskIds);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleReset = useCallback(async () => {
    if (!window.confirm('This will permanently delete all tasks, groups, and dependencies. Continue?')) return;
    await factoryReset();
    onClose();
  }, [onClose]);

  const handlePrefill = useCallback(
    async (preset: 'small' | 'medium' | 'large') => {
      if (!window.confirm(`This will replace all data with the ${preset} sample project. Continue?`)) return;
      await prefillData(preset);
      onClose();
    },
    [onClose],
  );

  const handleClearDeps = useCallback(async () => {
    if (!window.confirm('Remove all dependencies? Tasks and groups will be kept.')) return;
    await clearAllDependencies();
  }, []);

  const handleRandomizeColors = useCallback(async () => {
    await randomizeTaskColors();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
      data-testid="debug-modal-backdrop"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Debug Panel</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-lg"
            data-testid="debug-modal-close"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Factory Reset */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Factory Reset</h3>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
              data-testid="debug-reset-btn"
            >
              Reset Everything
            </button>
          </section>

          {/* Prefill Sample Data */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Prefill Sample Data</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handlePrefill('small')}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                data-testid="debug-prefill-small"
              >
                Small (~8 tasks)
              </button>
              <button
                onClick={() => handlePrefill('medium')}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                data-testid="debug-prefill-medium"
              >
                Medium (~30 tasks)
              </button>
              <button
                onClick={() => handlePrefill('large')}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                data-testid="debug-prefill-large"
              >
                Large (~100 tasks)
              </button>
            </div>
          </section>

          {/* State Inspector */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">State Inspector</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 bg-gray-50 rounded p-3">
              <span>Tasks</span>
              <span className="font-mono" data-testid="debug-task-count">{tasks.length}</span>
              <span>Dependencies</span>
              <span className="font-mono" data-testid="debug-dep-count">{dependencies.length}</span>
              <span>Groups</span>
              <span className="font-mono" data-testid="debug-group-count">{groups.length}</span>
              <span>Zoom level</span>
              <span className="font-mono">{zoomLevel}</span>
              <span>Scheduler</span>
              <span className="font-mono">{scheduleError ? `Error: ${scheduleError}` : 'OK'}</span>
              <span>Selected</span>
              <span className="font-mono">{selectedTaskIds.length > 0 ? selectedTaskIds.join(', ') : 'none'}</span>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleClearDeps}
                className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 border border-gray-200"
                data-testid="debug-clear-deps"
              >
                Clear all dependencies
              </button>
              <button
                onClick={collapseAllGroups}
                className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 border border-gray-200"
                data-testid="debug-collapse-all"
              >
                Collapse all groups
              </button>
              <button
                onClick={expandAllGroups}
                className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 border border-gray-200"
                data-testid="debug-expand-all"
              >
                Expand all groups
              </button>
              <button
                onClick={handleRandomizeColors}
                className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 border border-gray-200"
                data-testid="debug-randomize-colors"
              >
                Randomize task colors
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
