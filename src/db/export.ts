import type { Task, Dependency, Group, Project } from '../domain/types';
import { db } from './db';

export interface PlanlineExport {
  version: 1;
  project: Project;
  tasks: Task[];
  dependencies: Dependency[];
  groups: Group[];
}

export function buildExportData(
  project: Project,
  tasks: Task[],
  dependencies: Dependency[],
  groups: Group[]
): PlanlineExport {
  return {
    version: 1,
    project,
    tasks,
    dependencies,
    groups,
  };
}

export function validateImportData(data: unknown): data is PlanlineExport {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.tasks)) return false;
  if (!Array.isArray(d.dependencies)) return false;
  if (!Array.isArray(d.groups)) return false;
  if (!d.project || typeof d.project !== 'object') return false;
  const p = d.project as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.name !== 'string') return false;
  return true;
}

export async function importProject(data: PlanlineExport): Promise<void> {
  // Clear existing data
  await Promise.all([
    db.tasks.clear(),
    db.dependencies.clear(),
    db.groups.clear(),
    db.project.clear(),
  ]);

  // Write new data
  await Promise.all([
    db.tasks.bulkPut(data.tasks),
    db.dependencies.bulkPut(data.dependencies),
    db.groups.bulkPut(data.groups),
    db.project.put(data.project),
  ]);
}
