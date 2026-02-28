import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Sidebar } from './components/Sidebar';
import { Timeline } from './components/Timeline';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { SIDEBAR_WIDTH } from './constants';

function App() {
  const isLoaded = useProjectStore((s) => s.isLoaded);
  const hydrate = useProjectStore((s) => s.hydrate);
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

  return (
    <div className="flex h-screen overflow-hidden bg-white text-gray-900">
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
