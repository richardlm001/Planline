import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as repo from '../repository';
import { db } from '../db';
import type { Task, Dependency, Group, Project } from '../../domain/types';

beforeEach(async () => {
  // Clear all tables
  await db.tasks.clear();
  await db.dependencies.clear();
  await db.groups.clear();
  await db.project.clear();
});

describe('repository', () => {
  describe('loadAll', () => {
    it('returns empty arrays when DB is empty', async () => {
      const data = await repo.loadAll();
      expect(data.tasks).toEqual([]);
      expect(data.dependencies).toEqual([]);
      expect(data.groups).toEqual([]);
      expect(data.project).toEqual({
        id: 'default',
        name: 'Project 01',
        epoch: '2024-01-01',
      });
    });

    it('returns existing data', async () => {
      const task: Task = { id: 't1', name: 'Task', startDayIndex: 0, durationDays: 3, color: '#3B82F6', sortOrder: 0 };
      const dep: Dependency = { id: 'd1', fromTaskId: 't1', toTaskId: 't2' };
      const group: Group = { id: 'g1', name: 'Group', collapsed: false, sortOrder: 0 };
      const project: Project = { id: 'default', name: 'My Project', epoch: '2024-01-01' };

      await db.tasks.add(task);
      await db.dependencies.add(dep);
      await db.groups.add(group);
      await db.project.put(project);

      const data = await repo.loadAll();
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0]).toEqual(task);
      expect(data.dependencies).toHaveLength(1);
      expect(data.dependencies[0]).toEqual(dep);
      expect(data.groups).toHaveLength(1);
      expect(data.groups[0]).toEqual(group);
      expect(data.project.name).toBe('My Project');
    });
  });

  describe('saveTask / deleteTask', () => {
    it('saves a task and retrieves it', async () => {
      const task: Task = { id: 't1', name: 'Test', startDayIndex: 5, durationDays: 2, color: '#EF4444', sortOrder: 0 };
      await repo.saveTask(task);

      const stored = await db.tasks.get('t1');
      expect(stored).toEqual(task);
    });

    it('updates a task via put', async () => {
      const task: Task = { id: 't1', name: 'Original', startDayIndex: 0, durationDays: 1, color: '#3B82F6', sortOrder: 0 };
      await repo.saveTask(task);
      await repo.saveTask({ ...task, name: 'Updated' });

      const stored = await db.tasks.get('t1');
      expect(stored?.name).toBe('Updated');
    });

    it('deletes a task', async () => {
      const task: Task = { id: 't1', name: 'Test', startDayIndex: 0, durationDays: 1, color: '#3B82F6', sortOrder: 0 };
      await repo.saveTask(task);
      await repo.deleteTask('t1');

      const stored = await db.tasks.get('t1');
      expect(stored).toBeUndefined();
    });
  });

  describe('saveDependency / deleteDependency', () => {
    it('saves and retrieves a dependency', async () => {
      const dep: Dependency = { id: 'd1', fromTaskId: 't1', toTaskId: 't2' };
      await repo.saveDependency(dep);

      const stored = await db.dependencies.get('d1');
      expect(stored).toEqual(dep);
    });

    it('deletes a dependency', async () => {
      const dep: Dependency = { id: 'd1', fromTaskId: 't1', toTaskId: 't2' };
      await repo.saveDependency(dep);
      await repo.deleteDependency('d1');

      const stored = await db.dependencies.get('d1');
      expect(stored).toBeUndefined();
    });
  });

  describe('deleteDependenciesForTask', () => {
    it('deletes all dependencies involving a task', async () => {
      await repo.saveDependency({ id: 'd1', fromTaskId: 't1', toTaskId: 't2' });
      await repo.saveDependency({ id: 'd2', fromTaskId: 't2', toTaskId: 't3' });
      await repo.saveDependency({ id: 'd3', fromTaskId: 't3', toTaskId: 't1' });

      await repo.deleteDependenciesForTask('t1');

      const remaining = await db.dependencies.toArray();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('d2');
    });
  });

  describe('saveGroup / deleteGroup', () => {
    it('saves and retrieves a group', async () => {
      const group: Group = { id: 'g1', name: 'Sprint 1', collapsed: false, sortOrder: 0 };
      await repo.saveGroup(group);

      const stored = await db.groups.get('g1');
      expect(stored).toEqual(group);
    });

    it('updates a group via put', async () => {
      const group: Group = { id: 'g1', name: 'Original', collapsed: false, sortOrder: 0 };
      await repo.saveGroup(group);
      await repo.saveGroup({ ...group, name: 'Updated', collapsed: true });

      const stored = await db.groups.get('g1');
      expect(stored?.name).toBe('Updated');
      expect(stored?.collapsed).toBe(true);
    });

    it('deletes a group', async () => {
      const group: Group = { id: 'g1', name: 'Test', collapsed: false, sortOrder: 0 };
      await repo.saveGroup(group);
      await repo.deleteGroup('g1');

      const stored = await db.groups.get('g1');
      expect(stored).toBeUndefined();
    });
  });

  describe('saveProject', () => {
    it('saves and retrieves a project', async () => {
      const project: Project = { id: 'default', name: 'Test Project', epoch: '2024-06-01' };
      await repo.saveProject(project);

      const stored = await db.project.get('default');
      expect(stored).toEqual(project);
    });

    it('updates project via put', async () => {
      const project: Project = { id: 'default', name: 'V1', epoch: '2024-01-01' };
      await repo.saveProject(project);
      await repo.saveProject({ ...project, name: 'V2' });

      const stored = await db.project.get('default');
      expect(stored?.name).toBe('V2');
    });
  });
});
