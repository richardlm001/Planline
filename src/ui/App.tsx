import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SIDEBAR_WIDTH } from './constants';

function App() {
  const isLoaded = useProjectStore((s) => s.isLoaded);
  const hydrate = useProjectStore((s) => s.hydrate);
  const hydrationError = useProjectStore((s) => s.hydrationError);
  const persistError = useProjectStore((s) => s.persistError);
  const dismissError = useProjectStore((s) => s.dismissError);
  const setLinkingFromTaskId = useProjectStore((s) => s.setLinkingFromTaskId);
  const hasHydrated = useRef(false);

  useKeyboardShortcuts();

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      hydrate();
    }
  }, [hydrate]);

  // Cancel linking on pointer up anywhere
  const handleGlobalPointerUp = useCallback(() => {
    setLinkingFromTaskId(null);
  }, [setLinkingFromTaskId]);

  useEffect(() => {
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [handleGlobalPointerUp]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-gray-500">
        Loading…
      </div>
    );
  }

  if (hydrationError) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">Failed to load data</div>
          <p className="text-gray-600 text-sm mb-4">{hydrationError}</p>
          <button
            onClick={() => { dismissError(); hydrate(); }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-900">
      {persistError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow-lg max-w-sm" data-testid="persist-error-toast">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium">Save failed</div>
              <div className="text-xs mt-0.5">{persistError}</div>
            </div>
            <button onClick={dismissError} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}
      <div
        className="flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <Sidebar />
      </div>
      <div className="flex-1 overflow-hidden">
        <Timeline />
      </div>
    </div>
  );
}

export default App;
