import { useProjectStore } from '../../store/useProjectStore';
import { STATUS_BAR_HEIGHT } from '../constants';
import { Save } from 'lucide-react';

const shortcuts = [
  { keys: ['↑', '↓'], label: 'Navigate' },
  { keys: ['Enter'], label: 'New task' },
  { keys: ['Shift', 'Enter'], label: 'New group' },
  { keys: ['Tab'], label: 'Add dependent' },
  { keys: ['F2'], label: 'Rename' },
  { keys: ['Del'], label: 'Delete' },
] as const;

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded border border-gray-300 text-gray-400 text-[10px] font-sans leading-none">
      {children}
    </kbd>
  );
}

export function StatusBar() {
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const selectedTaskIds = useProjectStore((s) => s.selectedTaskIds);
  const selectedGroupId = useProjectStore((s) => s.selectedGroupId);

  const hasSelection = selectedTaskIds.length > 0 || selectedGroupId !== null;

  const statusLabel = lastSavedAt ? 'Saved on device' : 'Not yet saved';

  return (
    <div
      className="flex items-center justify-between px-2 bg-gray-100 border-t border-gray-200 text-[11px] text-gray-500 flex-shrink-0 select-none"
      style={{ height: STATUS_BAR_HEIGHT }}
      data-testid="status-bar"
    >
      {/* Left: save status */}
      <div className="flex items-center gap-1.5" data-testid="saved-indicator">
        <Save size={11} className="text-gray-400" />
        <span>{statusLabel}</span>
      </div>

      {/* Right: keyboard shortcuts */}
      <div className="flex items-center gap-3 text-gray-400">
        {shortcuts.map(({ keys, label }) => {
          const keyId = keys.join('+');
          const needsSelection = keyId === 'Tab' || keyId === 'F2' || keyId === 'Del';
          if (needsSelection && !hasSelection) return null;
          return (
            <span key={keys.join('+')} className="flex items-center gap-1">
              <span className="flex items-center gap-0.5">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
              <span>{label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
