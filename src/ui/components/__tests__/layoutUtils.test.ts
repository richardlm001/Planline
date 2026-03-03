import { describe, it, expect } from 'vitest';
import type { Task, Group } from '../../../domain/types';
import { buildVisualRowMap } from '../layoutUtils';

describe('buildVisualRowMap', () => {
  const makeTask = (overrides: Partial<Task> & { id: string; sortOrder: number }): Task => ({
    name: 'Task',
    startDayIndex: 0,
    durationDays: 3,
    color: '#3B82F6',
    ...overrides,
  });

  const makeGroup = (overrides: Partial<Group> & { id: string; sortOrder: number }): Group => ({
    name: 'Group',
    collapsed: false,
    ...overrides,
  });

  it('returns flat indices when there are no groups', () => {
    const tasks = [
      makeTask({ id: 't1', sortOrder: 0 }),
      makeTask({ id: 't2', sortOrder: 1 }),
      makeTask({ id: 't3', sortOrder: 2 }),
    ];
    const result = buildVisualRowMap(tasks, [], new Set());

    expect(result.taskRowIndex.get('t1')).toBe(0);
    expect(result.taskRowIndex.get('t2')).toBe(1);
    expect(result.taskRowIndex.get('t3')).toBe(2);
    expect(result.totalVisualRows).toBe(3);
    expect(result.visibleTasks).toHaveLength(3);
  });

  it('places ungrouped tasks before group headers', () => {
    const tasks = [
      makeTask({ id: 'ungrouped', sortOrder: 0 }),
      makeTask({ id: 'grouped', sortOrder: 1, groupId: 'g1' }),
    ];
    const groups = [makeGroup({ id: 'g1', sortOrder: 0 })];
    const result = buildVisualRowMap(tasks, groups, new Set());

    // Row 0: ungrouped task
    // Row 1: group header
    // Row 2: grouped task
    expect(result.taskRowIndex.get('ungrouped')).toBe(0);
    expect(result.groupHeaderRowIndex.get('g1')).toBe(1);
    expect(result.taskRowIndex.get('grouped')).toBe(2);
    expect(result.totalVisualRows).toBe(3);
  });

  it('accounts for group header rows in row indices', () => {
    const tasks = [
      makeTask({ id: 't1', sortOrder: 0, groupId: 'g1' }),
      makeTask({ id: 't2', sortOrder: 1, groupId: 'g1' }),
      makeTask({ id: 't3', sortOrder: 2, groupId: 'g2' }),
    ];
    const groups = [
      makeGroup({ id: 'g1', sortOrder: 0 }),
      makeGroup({ id: 'g2', sortOrder: 1 }),
    ];
    const result = buildVisualRowMap(tasks, groups, new Set());

    // Row 0: g1 header
    // Row 1: t1
    // Row 2: t2
    // Row 3: g2 header
    // Row 4: t3
    expect(result.groupHeaderRowIndex.get('g1')).toBe(0);
    expect(result.taskRowIndex.get('t1')).toBe(1);
    expect(result.taskRowIndex.get('t2')).toBe(2);
    expect(result.groupHeaderRowIndex.get('g2')).toBe(3);
    expect(result.taskRowIndex.get('t3')).toBe(4);
    expect(result.totalVisualRows).toBe(5);
  });

  it('excludes children of collapsed groups from visible tasks', () => {
    const tasks = [
      makeTask({ id: 't1', sortOrder: 0, groupId: 'g1' }),
      makeTask({ id: 't2', sortOrder: 1, groupId: 'g1' }),
      makeTask({ id: 't3', sortOrder: 2, groupId: 'g2' }),
    ];
    const groups = [
      makeGroup({ id: 'g1', sortOrder: 0, collapsed: true }),
      makeGroup({ id: 'g2', sortOrder: 1 }),
    ];
    const result = buildVisualRowMap(tasks, groups, new Set(['g1']));

    // Row 0: g1 header (collapsed, no children)
    // Row 1: g2 header
    // Row 2: t3
    expect(result.groupHeaderRowIndex.get('g1')).toBe(0);
    expect(result.taskRowIndex.has('t1')).toBe(false);
    expect(result.taskRowIndex.has('t2')).toBe(false);
    expect(result.groupHeaderRowIndex.get('g2')).toBe(1);
    expect(result.taskRowIndex.get('t3')).toBe(2);
    expect(result.totalVisualRows).toBe(3);
    expect(result.visibleTasks).toHaveLength(1);
    expect(result.visibleTasks[0].id).toBe('t3');
  });

  it('matches sidebar ordering for medium dataset scenario (all tasks grouped)', () => {
    // Simulates the medium preset: 5 groups, 30 tasks, every task in a group
    const groups = [
      makeGroup({ id: 'g1', name: 'Planning', sortOrder: 0 }),
      makeGroup({ id: 'g2', name: 'Design', sortOrder: 1 }),
      makeGroup({ id: 'g3', name: 'Backend', sortOrder: 2 }),
      makeGroup({ id: 'g4', name: 'Frontend', sortOrder: 3 }),
      makeGroup({ id: 'g5', name: 'QA', sortOrder: 4 }),
    ];

    // 10 tasks, distributed round-robin across 5 groups (like sampleData.ts)
    const tasks: Task[] = [];
    for (let i = 0; i < 10; i++) {
      const group = groups[i % 5];
      tasks.push(makeTask({
        id: `task-${i}`,
        name: `Task ${i}`,
        sortOrder: i,
        groupId: group.id,
      }));
    }

    const result = buildVisualRowMap(tasks, groups, new Set());

    // Expected layout:
    // Row 0: g1 header
    // Row 1: task-0 (g1)
    // Row 2: task-5 (g1)
    // Row 3: g2 header
    // Row 4: task-1 (g2)
    // Row 5: task-6 (g2)
    // Row 6: g3 header
    // Row 7: task-2 (g3)
    // Row 8: task-7 (g3)
    // Row 9: g4 header
    // Row 10: task-3 (g4)
    // Row 11: task-8 (g4)
    // Row 12: g5 header
    // Row 13: task-4 (g5)
    // Row 14: task-9 (g5)
    expect(result.totalVisualRows).toBe(15); // 5 headers + 10 tasks

    expect(result.groupHeaderRowIndex.get('g1')).toBe(0);
    expect(result.taskRowIndex.get('task-0')).toBe(1);
    expect(result.taskRowIndex.get('task-5')).toBe(2);

    expect(result.groupHeaderRowIndex.get('g2')).toBe(3);
    expect(result.taskRowIndex.get('task-1')).toBe(4);
    expect(result.taskRowIndex.get('task-6')).toBe(5);

    expect(result.groupHeaderRowIndex.get('g5')).toBe(12);
    expect(result.taskRowIndex.get('task-4')).toBe(13);
    expect(result.taskRowIndex.get('task-9')).toBe(14);
  });

  it('rowItems entries match task and group header order', () => {
    const tasks = [
      makeTask({ id: 'u1', sortOrder: 0 }),
      makeTask({ id: 'g1t1', sortOrder: 1, groupId: 'g1' }),
    ];
    const groups = [makeGroup({ id: 'g1', sortOrder: 0 })];
    const result = buildVisualRowMap(tasks, groups, new Set());

    expect(result.rowItems).toHaveLength(3);
    expect(result.rowItems[0]).toEqual({ type: 'task', task: expect.objectContaining({ id: 'u1' }) });
    expect(result.rowItems[1]).toEqual({ type: 'group-header', group: expect.objectContaining({ id: 'g1' }) });
    expect(result.rowItems[2]).toEqual({ type: 'task', task: expect.objectContaining({ id: 'g1t1' }) });
  });
});
