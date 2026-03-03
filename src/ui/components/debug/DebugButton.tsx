import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { DebugModal } from './DebugModal';

export function DebugButton() {
  if (!import.meta.env.DEV) return null;

  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 text-center"
        data-testid="debug-open-btn"
      >
        <Wrench size={12} className="inline-block mr-1" /> Debug
      </button>
      {open && <DebugModal onClose={() => setOpen(false)} />}
    </>
  );
}
