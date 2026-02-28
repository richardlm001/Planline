import { db } from './db';
import type { Task, Dependency, Group, Project } from '../domain/types';
import { DEFAULTS } from '../domain/constants';

export async function loadAll(): Promise<{
  tasks: Task[];
  dependencies: Dependency[];
  groups: Group[];
  project: Project;
}> {
  const [tasks, dependencies, groups, projectArr] = await Promise.all([
    db.tasks.toArray(),
    db.dependencies.toArray(),
    db.groups.toArray(),
    db.project.toArray(),
  ]);

  const project = projectArr[0] ?? {
    id: DEFAULTS.projectId,
    name: DEFAULTS.projectName,
    epoch: '2024-01-01',
  };

  return { tasks, dependencies, groups, project };
}

export async function saveTask(task: Task): Promise<void> {
  await db.tasks.put(task);
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

export async function saveDependency(dep: Dependency): Promise<void> {
  await db.dependencies.put(dep);
}

export async function deleteDependency(id: string): Promise<void> {
  await db.dependencies.delete(id);
}

export async function deleteDependenciesForTask(taskId: string): Promise<void> {
  await db.dependencies
    .where('fromTaskId')
    .equals(taskId)
    .or('toTaskId')
    .equals(taskId)
    .delete();
}

export async function saveGroup(group: Group): Promise<void> {
  await db.groups.put(group);
}

export async function deleteGroup(id: string): Promise<void> {
  await db.groups.delete(id);
}

export async function saveProject(project: Project): Promise<void> {
  await db.project.put(project);
}
