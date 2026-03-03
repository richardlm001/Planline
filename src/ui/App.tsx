import { useEffect, useRef, useCallback, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ProjectHeader } from './components/ProjectHeader';
import { ExportImportButtons } from './components/ExportImportButtons';
import { ZoomToggle } from './components/ZoomToggle';
import { SIDEBAR_WIDTH, TOOLBAR_HEIGHT, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from './constants';

function App() {
  const isLoaded = useProjectStore((s) => s.isLoaded);
  const hydrate = useProjectStore((s) => s.hydrate);
  const hydrationError = useProjectStore((s) => s.hydrationError);
  const persistError = useProjectStore((s) => s.persistError);
  const dismissError = useProjectStore((s) => s.dismissError);
  const setLinkingFromTaskId = useProjectStore((s) => s.setLinkingFromTaskId);
  const hasHydrated = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH);
  const isResizing = useRef(false);

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

  // --- Sidebar resize handlers ---
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isResizing.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX));
    setSidebarWidth(newWidth);
  }, []);

  const handleResizePointerUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

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
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900 relative">
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
      {/* Fixed toolbar row */}
      <div className="flex flex-shrink-0 border-b border-gray-200" style={{ height: TOOLBAR_HEIGHT }}>
        <div
          className="flex items-center justify-between px-3 border-r border-gray-200 bg-gray-50 flex-shrink-0"
          style={{ width: sidebarWidth }}
        >
          <ProjectHeader />
          <ExportImportButtons />
        </div>
        <div className="flex items-center justify-end px-3 flex-1 bg-white">
          <ZoomToggle />
        </div>
      </div>
      {/* Single scroll container */}
      <div ref={scrollRef} data-testid="main-scroll" className="flex-1 overflow-auto">
        <div className="flex w-max min-h-full">
          <Sidebar width={sidebarWidth} />
          <Timeline scrollRef={scrollRef} sidebarWidth={sidebarWidth} />
        </div>
      </div>
      {/* Sidebar resize handle */}
      <div
        className="absolute top-0 bottom-0 w-1.5 cursor-col-resize z-50 group"
        style={{ left: sidebarWidth - 3 }}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        data-testid="sidebar-resize-handle"
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-transparent group-hover:bg-blue-400 transition-colors" />
      </div>
    </div>
  );
}

export default App;
