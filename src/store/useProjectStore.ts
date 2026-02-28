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
  selectedTaskIds: string[];
  selectionAnchorId: string | null;
  editingTaskId: string | null;
  linkingFromTaskId: string | null;
  zoomLevel: ZoomLevel;
  lastSavedAt: Date | null;
  isLoaded: boolean;
  hydrationError: string | null;
  persistError: string | null;

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
  selectTask: (id: string | null, opts?: { shift?: boolean; meta?: boolean }) => void;
  clearSelection: () => void;
  moveTasksToPosition: (taskIds: string[], targetIndex: number, targetGroupId?: string) => Promise<void>;
  setEditingTaskId: (id: string | null) => void;
  setLinkingFromTaskId: (id: string | null) => void;
  setZoomLevel: (level: ZoomLevel) => void;
  dismissError: () => void;
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
  selectedTaskIds: [],
  selectionAnchorId: null,
  editingTaskId: null,
  linkingFromTaskId: null,
  zoomLevel: 'day' as ZoomLevel,
  lastSavedAt: null,
  isLoaded: false,
  hydrationError: null,
  persistError: null,

  hydrate: async () => {
    try {
      const data = await repo.loadAll();
      const schedule = runScheduler(data.tasks, data.dependencies);
      set({
        ...data,
        ...schedule,
        isLoaded: true,
        hydrationError: null,
      });
    } catch (err) {
      set({
        isLoaded: true,
        hydrationError: err instanceof Error ? err.message : 'Failed to load data',
      });
    }
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

    try {
      await repo.saveTask(task);
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to save task' });
    }
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
    if (updated) {
      try {
        await repo.saveTask(updated);
      } catch (err) {
        set({ persistError: err instanceof Error ? err.message : 'Failed to update task' });
      }
    }
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
      selectedTaskIds: state.selectedTaskIds.filter((sid) => sid !== id),
      lastSavedAt: new Date(),
    });

    try {
      await repo.deleteTask(id);
      await repo.deleteDependenciesForTask(id);
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to remove task' });
    }
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

    try {
      await repo.saveDependency(dep);
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to save dependency' });
    }
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

    try {
      await repo.deleteDependency(id);
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to remove dependency' });
    }
  },

  updateProject: async (partial: Partial<Project>) => {
    const state = get();
    const updated = { ...state.project, ...partial };

    set({
      project: updated,
      lastSavedAt: new Date(),
    });

    try {
      await repo.saveProject(updated);
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to save project' });
    }
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

    try {
      await repo.saveGroup(group);
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to save group' });
    }
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
    if (updated) {
      try {
        await repo.saveGroup(updated);
      } catch (err) {
        set({ persistError: err instanceof Error ? err.message : 'Failed to update group' });
      }
    }
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

    try {
      await repo.deleteGroup(id);
      for (const t of newTasks.filter((t) => !t.groupId)) {
        const original = state.tasks.find((o) => o.id === t.id);
        if (original?.groupId === id) {
          await repo.saveTask(t);
        }
      }
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to remove group' });
    }
  },

  selectTask: (id: string | null, opts?: { shift?: boolean; meta?: boolean }) => {
    if (id === null) {
      set({ selectedTaskIds: [], selectionAnchorId: null });
      return;
    }

    const state = get();

    if (opts?.meta) {
      // Cmd/Ctrl+click: toggle individual task
      const isAlreadySelected = state.selectedTaskIds.includes(id);
      const newIds = isAlreadySelected
        ? state.selectedTaskIds.filter((sid) => sid !== id)
        : [...state.selectedTaskIds, id];
      set({ selectedTaskIds: newIds, selectionAnchorId: id });
      return;
    }

    if (opts?.shift && state.selectionAnchorId) {
      // Shift+click: select range based on sorted task list
      const sortedTasks = [...state.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
      const anchorIdx = sortedTasks.findIndex((t) => t.id === state.selectionAnchorId);
      const targetIdx = sortedTasks.findIndex((t) => t.id === id);
      if (anchorIdx >= 0 && targetIdx >= 0) {
        const start = Math.min(anchorIdx, targetIdx);
        const end = Math.max(anchorIdx, targetIdx);
        const rangeIds = sortedTasks.slice(start, end + 1).map((t) => t.id);
        set({ selectedTaskIds: rangeIds });
        return;
      }
    }

    // Plain click: select single task
    set({ selectedTaskIds: [id], selectionAnchorId: id });
  },

  clearSelection: () => {
    set({ selectedTaskIds: [], selectionAnchorId: null });
  },

  moveTasksToPosition: async (taskIds: string[], targetIndex: number, targetGroupId?: string) => {
    const state = get();
    const movingSet = new Set(taskIds);

    // Build the full sorted task list
    const sorted = [...state.tasks].sort((a, b) => a.sortOrder - b.sortOrder);

    // Separate the tasks being moved (preserving their relative order)
    const moving = sorted.filter((t) => movingSet.has(t.id));
    const remaining = sorted.filter((t) => !movingSet.has(t.id));

    // Clamp targetIndex
    const clampedIndex = Math.max(0, Math.min(targetIndex, remaining.length));

    // Insert moving tasks at the target position
    const reordered = [
      ...remaining.slice(0, clampedIndex),
      ...moving,
      ...remaining.slice(clampedIndex),
    ];

    // Renormalize sortOrder and apply groupId changes
    const updatedTasks = reordered.map((t, i) => {
      const updates: Partial<Task> = { sortOrder: i };
      if (movingSet.has(t.id)) {
        updates.groupId = targetGroupId;
      }
      return { ...t, ...updates };
    });

    set({
      tasks: updatedTasks,
      lastSavedAt: new Date(),
    });

    // Persist all changed tasks
    try {
      for (const task of updatedTasks) {
        const original = state.tasks.find((t) => t.id === task.id);
        if (
          original &&
          (original.sortOrder !== task.sortOrder || original.groupId !== task.groupId)
        ) {
          await repo.saveTask(task);
        }
      }
    } catch (err) {
      set({ persistError: err instanceof Error ? err.message : 'Failed to move tasks' });
    }
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

  dismissError: () => {
    set({ persistError: null, hydrationError: null });
  },
}));
