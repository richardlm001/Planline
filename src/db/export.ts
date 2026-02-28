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

export function validateImportData(data: unknown): { valid: true; data: PlanlineExport } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Import data must be an object' };
  const d = data as Record<string, unknown>;

  // Version check
  if (d.version !== 1) return { valid: false, error: `Unsupported version: ${String(d.version)}. Expected 1` };

  // Project
  if (!d.project || typeof d.project !== 'object') return { valid: false, error: 'Missing project object' };
  const p = d.project as Record<string, unknown>;
  if (typeof p.id !== 'string') return { valid: false, error: 'project.id must be a string' };
  if (typeof p.name !== 'string') return { valid: false, error: 'project.name must be a string' };
  if (typeof p.epoch !== 'string') return { valid: false, error: 'project.epoch must be a string' };

  // Tasks
  if (!Array.isArray(d.tasks)) return { valid: false, error: 'tasks must be an array' };
  for (let i = 0; i < d.tasks.length; i++) {
    const t = d.tasks[i] as Record<string, unknown>;
    if (typeof t.id !== 'string') return { valid: false, error: `tasks[${i}].id must be a string` };
    if (typeof t.name !== 'string') return { valid: false, error: `tasks[${i}].name must be a string` };
    if (typeof t.startDayIndex !== 'number') return { valid: false, error: `tasks[${i}].startDayIndex must be a number` };
    if (typeof t.durationDays !== 'number' || t.durationDays < 1) return { valid: false, error: `tasks[${i}].durationDays must be a positive number` };
    if (typeof t.color !== 'string') return { valid: false, error: `tasks[${i}].color must be a string` };
    if (typeof t.sortOrder !== 'number') return { valid: false, error: `tasks[${i}].sortOrder must be a number` };
    if (t.groupId !== undefined && typeof t.groupId !== 'string') return { valid: false, error: `tasks[${i}].groupId must be a string or undefined` };
  }

  // Dependencies
  if (!Array.isArray(d.dependencies)) return { valid: false, error: 'dependencies must be an array' };
  const taskIds = new Set((d.tasks as Array<{ id: string }>).map((t) => t.id));
  for (let i = 0; i < d.dependencies.length; i++) {
    const dep = d.dependencies[i] as Record<string, unknown>;
    if (typeof dep.id !== 'string') return { valid: false, error: `dependencies[${i}].id must be a string` };
    if (typeof dep.fromTaskId !== 'string') return { valid: false, error: `dependencies[${i}].fromTaskId must be a string` };
    if (typeof dep.toTaskId !== 'string') return { valid: false, error: `dependencies[${i}].toTaskId must be a string` };
    if (!taskIds.has(dep.fromTaskId as string)) return { valid: false, error: `dependencies[${i}].fromTaskId "${dep.fromTaskId}" references non-existent task` };
    if (!taskIds.has(dep.toTaskId as string)) return { valid: false, error: `dependencies[${i}].toTaskId "${dep.toTaskId}" references non-existent task` };
  }

  // Groups
  if (!Array.isArray(d.groups)) return { valid: false, error: 'groups must be an array' };
  for (let i = 0; i < d.groups.length; i++) {
    const g = d.groups[i] as Record<string, unknown>;
    if (typeof g.id !== 'string') return { valid: false, error: `groups[${i}].id must be a string` };
    if (typeof g.name !== 'string') return { valid: false, error: `groups[${i}].name must be a string` };
    if (typeof g.collapsed !== 'boolean') return { valid: false, error: `groups[${i}].collapsed must be a boolean` };
    if (typeof g.sortOrder !== 'number') return { valid: false, error: `groups[${i}].sortOrder must be a number` };
  }

  // Referential integrity: task groupIds → existing groups
  const groupIds = new Set((d.groups as Array<{ id: string }>).map((g) => g.id));
  for (let i = 0; i < d.tasks.length; i++) {
    const t = d.tasks[i] as Record<string, unknown>;
    if (t.groupId && !groupIds.has(t.groupId as string)) {
      return { valid: false, error: `tasks[${i}].groupId "${t.groupId}" references non-existent group` };
    }
  }

  return { valid: true, data: data as PlanlineExport };
}

export async function importProject(data: PlanlineExport): Promise<void> {
  await db.transaction('rw', [db.tasks, db.dependencies, db.groups, db.project], async () => {
    await Promise.all([
      db.tasks.clear(),
      db.dependencies.clear(),
      db.groups.clear(),
      db.project.clear(),
    ]);

    await Promise.all([
      db.tasks.bulkPut(data.tasks),
      db.dependencies.bulkPut(data.dependencies),
      db.groups.bulkPut(data.groups),
      db.project.put(data.project),
    ]);
  });
}
