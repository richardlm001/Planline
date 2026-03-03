import { useRef, useState, useCallback, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { buildExportData, validateImportData, importProject } from '../../db/export';
import { DebugModal } from './debug/DebugModal';
import { format } from 'date-fns';
import { EllipsisVertical } from 'lucide-react';

export function ExportImportButtons() {
  const project = useProjectStore((s) => s.project);
  const tasks = useProjectStore((s) => s.tasks);
  const dependencies = useProjectStore((s) => s.dependencies);
  const groups = useProjectStore((s) => s.groups);
  const hydrate = useProjectStore((s) => s.hydrate);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = useCallback(() => {
    const data = buildExportData(project, tasks, dependencies, groups);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const filename = `planline-${slug}-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  }, [project, tasks, dependencies, groups]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      const result = validateImportData(data);
      if (!result.valid) {
        alert(`Invalid Planline JSON file: ${result.error}`);
        return;
      }

      if (!confirm('This will replace all current data. Continue?')) return;

      await importProject(result.data);
      await hydrate();
    } catch {
      alert('Failed to parse JSON file.');
    }

    // Reset file input so the same file can be imported again
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsOpen(false);
  }, [hydrate]);

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        data-testid="project-menu-btn"
        title="Project menu"
      >
        <EllipsisVertical size={14} />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 z-50 min-w-[120px]"
          data-testid="project-menu"
        >
          <button
            onClick={handleExport}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            data-testid="export-btn"
          >
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            data-testid="import-btn"
          >
            Import
          </button>
          {import.meta.env.DEV && (
            <button
              onClick={() => { setDebugOpen(true); setIsOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              data-testid="debug-open-btn"
            >
              Debug
            </button>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
        data-testid="import-file-input"
      />
      {debugOpen && <DebugModal onClose={() => setDebugOpen(false)} />}
    </div>
  );
}
