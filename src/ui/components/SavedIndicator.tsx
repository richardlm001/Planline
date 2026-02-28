import { useProjectStore } from '../../store/useProjectStore';

export function SavedIndicator() {
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);

  const label = lastSavedAt
    ? `Saved on device`
    : 'Not yet saved';

  return (
    <div
      className="px-3 py-2 text-[11px] text-gray-400 flex items-center gap-1.5 border-t border-gray-200"
      data-testid="saved-indicator"
    >
      <span>💾</span>
      <span>{label}</span>
    </div>
  );
}
