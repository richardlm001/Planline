import { useRef, useCallback } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { buildExportData, validateImportData, importProject } from '../../db/export';
import type { PlanlineExport } from '../../db/export';
import { format } from 'date-fns';

export function ExportImportButtons() {
  const project = useProjectStore((s) => s.project);
  const tasks = useProjectStore((s) => s.tasks);
  const dependencies = useProjectStore((s) => s.dependencies);
  const groups = useProjectStore((s) => s.groups);
  const hydrate = useProjectStore((s) => s.hydrate);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [project, tasks, dependencies, groups]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      if (!validateImportData(data)) {
        alert('Invalid Planline JSON file.');
        return;
      }

      if (!confirm('This will replace all current data. Continue?')) return;

      await importProject(data as PlanlineExport);
      await hydrate();
    } catch {
      alert('Failed to parse JSON file.');
    }

    // Reset file input so the same file can be imported again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [hydrate]);

  return (
    <div className="flex gap-1">
      <button
        onClick={handleExport}
        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
        data-testid="export-btn"
        title="Export JSON"
      >
        Export
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
        data-testid="import-btn"
        title="Import JSON"
      >
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
        data-testid="import-file-input"
      />
    </div>
  );
}
