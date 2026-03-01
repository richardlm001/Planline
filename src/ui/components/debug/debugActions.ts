import { db } from '../../../db/db';
import { useProjectStore } from '../../../store/useProjectStore';
import { COLOR_PALETTE } from '../../../domain/constants';
import type { SampleProject } from './sampleData';
import { generateSmallProject, generateMediumProject, generateLargeProject } from './sampleData';

export async function factoryReset(): Promise<void> {
  await Promise.all([
    db.tasks.clear(),
    db.dependencies.clear(),
    db.groups.clear(),
    db.project.clear(),
  ]);
  await useProjectStore.getState().hydrate();
}

export async function prefillData(preset: 'small' | 'medium' | 'large'): Promise<void> {
  // Clear existing data
  await Promise.all([
    db.tasks.clear(),
    db.dependencies.clear(),
    db.groups.clear(),
    db.project.clear(),
  ]);

  const generators: Record<string, () => SampleProject> = {
    small: generateSmallProject,
    medium: generateMediumProject,
    large: generateLargeProject,
  };

  const data = generators[preset]();

  // Bulk insert
  await Promise.all([
    db.tasks.bulkPut(data.tasks),
    db.dependencies.bulkPut(data.dependencies),
    db.groups.bulkPut(data.groups),
    db.project.put(data.project),
  ]);

  // Re-hydrate store (runs scheduler)
  await useProjectStore.getState().hydrate();
}

export async function clearAllDependencies(): Promise<void> {
  await db.dependencies.clear();
  await useProjectStore.getState().hydrate();
}

export function collapseAllGroups(): void {
  const state = useProjectStore.getState();
  for (const group of state.groups) {
    if (!group.collapsed) {
      void state.updateGroup(group.id, { collapsed: true });
    }
  }
}

export function expandAllGroups(): void {
  const state = useProjectStore.getState();
  for (const group of state.groups) {
    if (group.collapsed) {
      void state.updateGroup(group.id, { collapsed: false });
    }
  }
}

export async function randomizeTaskColors(): Promise<void> {
  const state = useProjectStore.getState();
  for (const task of state.tasks) {
    const newColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    await state.updateTask(task.id, { color: newColor });
  }
}
