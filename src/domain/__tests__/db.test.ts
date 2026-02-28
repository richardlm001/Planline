import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { PlanlineDB } from '../../db/db';
import type { Task } from '../types';

describe('Dexie DB', () => {
  let db: PlanlineDB;

  beforeEach(async () => {
    db = new PlanlineDB();
    await db.delete();
    db = new PlanlineDB();
  });

  it('should write and read a task', async () => {
    const task: Task = {
      id: 'task-1',
      name: 'Test task',
      startDayIndex: 0,
      durationDays: 3,
      color: '#3B82F6',
      sortOrder: 0,
    };

    await db.tasks.add(task);
    const retrieved = await db.tasks.get('task-1');

    expect(retrieved).toEqual(task);
  });

  it('should write and read multiple tasks', async () => {
    const tasks: Task[] = [
      { id: 't1', name: 'A', startDayIndex: 0, durationDays: 1, color: '#3B82F6', sortOrder: 0 },
      { id: 't2', name: 'B', startDayIndex: 1, durationDays: 2, color: '#10B981', sortOrder: 1 },
    ];

    await db.tasks.bulkAdd(tasks);
    const all = await db.tasks.toArray();

    expect(all).toHaveLength(2);
  });
});
