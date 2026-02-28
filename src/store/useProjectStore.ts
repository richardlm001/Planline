import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Task, Dependency, Group, Project } from '../domain/types';
import { propagate } from '../domain/scheduler';
import type { ScheduleResult } from '../domain/scheduler';
import { DEFAULTS, COLOR_PALETTE, todayDayIndex } from '../domain/constants';
import type { ZoomLevel } from '../ui/constants';
import * as repo from '../db/repository';

interface ProjectState {
  // Data
  tasks: Task[];
  dependencies: Dependency[];
  groups: Group[];
  project: Project;

  // Computed
  computedStarts: Map<string, number>;
  scheduleError: string | null;
  cycleTaskIds: string[];

  // UI state
  selectedTaskId: string | null;
  editingTaskId: string | null;
  linkingFromTaskId: string | null;
  zoomLevel: ZoomLevel;
  lastSavedAt: Date | null;
  isLoaded: boolean;

  // Actions
  hydrate: () => Promise<void>;
  addTask: (task?: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, partial: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addDependency: (fromTaskId: string, toTaskId: string) => Promise<{ ok: boolean; error?: string }>;
  removeDependency: (id: string) => Promise<void>;
  updateProject: (partial: Partial<Project>) => Promise<void>;
  addGroup: (group?: Partial<Group>) => Promise<Group>;
  updateGroup: (id: string, partial: Partial<Group>) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
  selectTask: (id: string | null) => void;
  setEditingTaskId: (id: string | null) => void;
  setLinkingFromTaskId: (id: string | null) => void;
  setZoomLevel: (level: ZoomLevel) => void;
}

function runScheduler(tasks: Task[], dependencies: Dependency[]) {
  const result: ScheduleResult = propagate(tasks, dependencies);
  if (result.ok) {
    return {
      computedStarts: result.starts,
      scheduleError: null,
      cycleTaskIds: [] as string[],
    };
  } else {
    return {
      computedStarts: new Map<string, number>(),
      scheduleError: result.error,
      cycleTaskIds: result.taskIds,
    };
  }
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  tasks: [],
  dependencies: [],
  groups: [],
  project: {
    id: DEFAULTS.projectId,
    name: DEFAULTS.projectName,
    epoch: '2024-01-01',
  },
  computedStarts: new Map(),
  scheduleError: null,
  cycleTaskIds: [],
  selectedTaskId: null,
  editingTaskId: null,
  linkingFromTaskId: null,
  zoomLevel: 'day' as ZoomLevel,
  lastSavedAt: null,
  isLoaded: false,

  hydrate: async () => {
    const data = await repo.loadAll();
    const schedule = runScheduler(data.tasks, data.dependencies);
    set({
      ...data,
      ...schedule,
      isLoaded: true,
    });
  },

  addTask: async (partial?: Partial<Task>) => {
    const state = get();
    const maxSortOrder = state.tasks.reduce((max, t) => Math.max(max, t.sortOrder), -1);
    const colorIndex = state.tasks.length % COLOR_PALETTE.length;

    const task: Task = {
      id: nanoid(),
      name: DEFAULTS.taskName,
      startDayIndex: todayDayIndex(),
      durationDays: DEFAULTS.taskDuration,
      color: COLOR_PALETTE[colorIndex],
      sortOrder: maxSortOrder + 1,
      ...partial,
    };

    const newTasks = [...state.tasks, task];
    const schedule = runScheduler(newTasks, state.dependencies);

    set({
      tasks: newTasks,
      ...schedule,
      lastSavedAt: new Date(),
    });

    await repo.saveTask(task);
    return task;
  },

  updateTask: async (id: string, partial: Partial<Task>) => {
    const state = get();
    const newTasks = state.tasks.map((t) => (t.id === id ? { ...t, ...partial } : t));

    // Only run the scheduler when scheduling-relevant fields change
    const schedulingFields: (keyof Task)[] = ['startDayIndex', 'durationDays'];
    const needsReschedule = schedulingFields.some((f) => f in partial);

    if (needsReschedule) {
      const schedule = runScheduler(newTasks, state.dependencies);
      set({
        tasks: newTasks,
        ...schedule,
        lastSavedAt: new Date(),
      });
    } else {
      set({
        tasks: newTasks,
        lastSavedAt: new Date(),
      });
    }

    const updated = newTasks.find((t) => t.id === id);
    if (updated) await repo.saveTask(updated);
  },

  removeTask: async (id: string) => {
    const state = get();
    const newTasks = state.tasks.filter((t) => t.id !== id);
    const newDeps = state.dependencies.filter(
      (d) => d.fromTaskId !== id && d.toTaskId !== id
    );
    const schedule = runScheduler(newTasks, newDeps);

    set({
      tasks: newTasks,
      dependencies: newDeps,
      ...schedule,
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
      lastSavedAt: new Date(),
    });

    await repo.deleteTask(id);
    await repo.deleteDependenciesForTask(id);
  },

  addDependency: async (fromTaskId: string, toTaskId: string) => {
    const state = get();

    // Prevent self-dependency
    if (fromTaskId === toTaskId) {
      return { ok: false, error: 'Cannot create self-dependency' };
    }

    // Prevent duplicate
    const exists = state.dependencies.some(
      (d) => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
    );
    if (exists) {
      return { ok: false, error: 'Dependency already exists' };
    }

    const dep: Dependency = { id: nanoid(), fromTaskId, toTaskId };
    const newDeps = [...state.dependencies, dep];

    // Check for cycles before persisting
    const schedule = runScheduler(state.tasks, newDeps);
    if (schedule.scheduleError === 'cycle') {
      return { ok: false, error: 'Dependency would create a cycle' };
    }

    set({
      dependencies: newDeps,
      ...schedule,
      lastSavedAt: new Date(),
    });

    await repo.saveDependency(dep);
    return { ok: true };
  },

  removeDependency: async (id: string) => {
    const state = get();
    const newDeps = state.dependencies.filter((d) => d.id !== id);
    const schedule = runScheduler(state.tasks, newDeps);

    set({
      dependencies: newDeps,
      ...schedule,
      lastSavedAt: new Date(),
    });

    await repo.deleteDependency(id);
  },

  updateProject: async (partial: Partial<Project>) => {
    const state = get();
    const updated = { ...state.project, ...partial };

    set({
      project: updated,
      lastSavedAt: new Date(),
    });

    await repo.saveProject(updated);
  },

  addGroup: async (partial?: Partial<Group>) => {
    const state = get();
    const maxSortOrder = state.groups.reduce((max, g) => Math.max(max, g.sortOrder), -1);

    const group: Group = {
      id: nanoid(),
      name: 'New group',
      collapsed: false,
      sortOrder: maxSortOrder + 1,
      ...partial,
    };

    set({
      groups: [...state.groups, group],
      lastSavedAt: new Date(),
    });

    await repo.saveGroup(group);
    return group;
  },

  updateGroup: async (id: string, partial: Partial<Group>) => {
    const state = get();
    const newGroups = state.groups.map((g) => (g.id === id ? { ...g, ...partial } : g));

    set({
      groups: newGroups,
      lastSavedAt: new Date(),
    });

    const updated = newGroups.find((g) => g.id === id);
    if (updated) await repo.saveGroup(updated);
  },

  removeGroup: async (id: string) => {
    const state = get();
    const newGroups = state.groups.filter((g) => g.id !== id);
    const newTasks = state.tasks.map((t) =>
      t.groupId === id ? { ...t, groupId: undefined } : t
    );

    set({
      groups: newGroups,
      tasks: newTasks,
      lastSavedAt: new Date(),
    });

    await repo.deleteGroup(id);
    for (const t of newTasks.filter((t) => !t.groupId)) {
      const original = state.tasks.find((o) => o.id === t.id);
      if (original?.groupId === id) {
        await repo.saveTask(t);
      }
    }
  },

  selectTask: (id: string | null) => {
    set({ selectedTaskId: id });
  },

  setEditingTaskId: (id: string | null) => {
    set({ editingTaskId: id });
  },

  setLinkingFromTaskId: (id: string | null) => {
    set({ linkingFromTaskId: id });
  },

  setZoomLevel: (level: ZoomLevel) => {
    set({ zoomLevel: level });
  },
}));
