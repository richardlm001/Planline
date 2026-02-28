import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { buildExportData, validateImportData, importProject } from '../export';
import { db } from '../db';
import type { PlanlineExport } from '../export';

describe('Export / Import', () => {
  it('buildExportData produces valid export structure', () => {
    const project = { id: 'p1', name: 'Test', epoch: '2024-01-01' };
    const tasks = [{ id: 't1', name: 'A', startDayIndex: 0, durationDays: 2, color: '#3B82F6', sortOrder: 0 }];
    const dependencies = [{ id: 'd1', fromTaskId: 't1', toTaskId: 't2' }];
    const groups = [{ id: 'g1', name: 'G', collapsed: false, sortOrder: 0 }];

    const result = buildExportData(project, tasks, dependencies, groups);
    expect(result.version).toBe(1);
    expect(result.project).toEqual(project);
    expect(result.tasks).toEqual(tasks);
    expect(result.dependencies).toEqual(dependencies);
    expect(result.groups).toEqual(groups);
  });

  it('validateImportData accepts valid data', () => {
    const data: PlanlineExport = {
      version: 1,
      project: { id: 'p1', name: 'Test', epoch: '2024-01-01' },
      tasks: [],
      dependencies: [],
      groups: [],
    };
    const result = validateImportData(data);
    expect(result.valid).toBe(true);
  });

  it('validateImportData rejects invalid data', () => {
    expect(validateImportData(null).valid).toBe(false);
    expect(validateImportData({}).valid).toBe(false);
    expect(validateImportData({ version: 1, tasks: [], dependencies: [], groups: [] }).valid).toBe(false);
    expect(validateImportData({ version: 1, project: { id: 'x' }, tasks: [] }).valid).toBe(false);
  });

  it('validateImportData rejects invalid task fields', () => {
    const data = {
      version: 1,
      project: { id: 'p1', name: 'Test', epoch: '2024-01-01' },
      tasks: [{ id: 't1', name: 'A' }], // missing startDayIndex, durationDays, etc.
      dependencies: [],
      groups: [],
    };
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('startDayIndex');
  });

  it('validateImportData rejects dependencies referencing non-existent tasks', () => {
    const data = {
      version: 1,
      project: { id: 'p1', name: 'Test', epoch: '2024-01-01' },
      tasks: [{ id: 't1', name: 'A', startDayIndex: 0, durationDays: 2, color: '#3B82F6', sortOrder: 0 }],
      dependencies: [{ id: 'd1', fromTaskId: 't1', toTaskId: 'nonexistent' }],
      groups: [],
    };
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('non-existent task');
  });

  it('validateImportData rejects zero durationDays', () => {
    const data = {
      version: 1,
      project: { id: 'p1', name: 'Test', epoch: '2024-01-01' },
      tasks: [{ id: 't1', name: 'A', startDayIndex: 0, durationDays: 0, color: '#3B82F6', sortOrder: 0 }],
      dependencies: [],
      groups: [],
    };
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('positive');
  });

  it('importProject round-trips correctly', async () => {
    const data: PlanlineExport = {
      version: 1,
      project: { id: 'p1', name: 'Imported', epoch: '2024-01-01' },
      tasks: [
        { id: 't1', name: 'Task A', startDayIndex: 5, durationDays: 3, color: '#EF4444', sortOrder: 0 },
      ],
      dependencies: [],
      groups: [],
    };

    await importProject(data);

    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('Task A');

    const projects = await db.project.toArray();
    expect(projects[0].name).toBe('Imported');
  });
});
