import { describe, it, expect } from 'vitest';
import { propagate, getTaskEnd } from '../scheduler';
import type { Task, Dependency } from '../types';

function makeTask(id: string, start: number, duration: number): Task {
  return { id, name: id, startDayIndex: start, durationDays: duration, color: '#3B82F6', sortOrder: 0 };
}

function expectOk(result: ReturnType<typeof propagate>) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected ok');
  return result;
}

describe('scheduler - propagate', () => {
  it('no dependencies — tasks keep their original starts', () => {
    const result = expectOk(propagate([makeTask('A', 0, 3), makeTask('B', 5, 2)], []));
    expect(result.starts.get('A')).toBe(0);
    expect(result.starts.get('B')).toBe(5);
  });

  it('simple chain A → B → C', () => {
    const tasks = [makeTask('A', 0, 3), makeTask('B', 0, 2), makeTask('C', 0, 1)];
    const deps: Dependency[] = [
      { id: 'd1', fromTaskId: 'A', toTaskId: 'B' },
      { id: 'd2', fromTaskId: 'B', toTaskId: 'C' },
    ];
    const result = expectOk(propagate(tasks, deps));
    expect(result.starts.get('A')).toBe(0);
    expect(result.starts.get('B')).toBe(3);
    expect(result.starts.get('C')).toBe(5);
  });

  it('resize A shifts B and C', () => {
    const tasks = [makeTask('A', 0, 5), makeTask('B', 0, 2), makeTask('C', 0, 1)];
    const deps: Dependency[] = [
      { id: 'd1', fromTaskId: 'A', toTaskId: 'B' },
      { id: 'd2', fromTaskId: 'B', toTaskId: 'C' },
    ];
    const result = expectOk(propagate(tasks, deps));
    expect(result.starts.get('B')).toBe(5);
    expect(result.starts.get('C')).toBe(7);
  });

  it('move A shifts downstream', () => {
    const tasks = [makeTask('A', 10, 3), makeTask('B', 0, 2), makeTask('C', 0, 1)];
    const deps: Dependency[] = [
      { id: 'd1', fromTaskId: 'A', toTaskId: 'B' },
      { id: 'd2', fromTaskId: 'B', toTaskId: 'C' },
    ];
    const result = expectOk(propagate(tasks, deps));
    expect(result.starts.get('A')).toBe(10);
    expect(result.starts.get('B')).toBe(13);
    expect(result.starts.get('C')).toBe(15);
  });

  it('multiple predecessors — D depends on A and X', () => {
    const tasks = [makeTask('A', 0, 3), makeTask('X', 0, 7), makeTask('D', 0, 1)];
    const deps: Dependency[] = [
      { id: 'd1', fromTaskId: 'A', toTaskId: 'D' },
      { id: 'd2', fromTaskId: 'X', toTaskId: 'D' },
    ];
    const result = expectOk(propagate(tasks, deps));
    expect(result.starts.get('D')).toBe(7);
  });

  it('no dependencies on a task — unconnected task stays put', () => {
    const tasks = [makeTask('A', 0, 3), makeTask('B', 0, 2), makeTask('Lone', 20, 5)];
    const deps: Dependency[] = [{ id: 'd1', fromTaskId: 'A', toTaskId: 'B' }];
    const result = expectOk(propagate(tasks, deps));
    expect(result.starts.get('Lone')).toBe(20);
  });

  it('predecessor finishes before successor placed start — successor keeps its own later start', () => {
    const tasks = [makeTask('A', 0, 3), makeTask('B', 100, 2)];
    const deps: Dependency[] = [{ id: 'd1', fromTaskId: 'A', toTaskId: 'B' }];
    const result = expectOk(propagate(tasks, deps));
    expect(result.starts.get('B')).toBe(100);
  });
});

describe('scheduler - cycle detection', () => {
  it('simple cycle A → B → A', () => {
    const tasks = [makeTask('A', 0, 3), makeTask('B', 0, 2)];
    const deps: Dependency[] = [
      { id: 'd1', fromTaskId: 'A', toTaskId: 'B' },
      { id: 'd2', fromTaskId: 'B', toTaskId: 'A' },
    ];
    const result = propagate(tasks, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('cycle');
      expect(result.taskIds.sort()).toEqual(['A', 'B']);
    }
  });

  it('cycle in subset — non-cyclic tasks still identified', () => {
    const tasks = [makeTask('A', 0, 3), makeTask('B', 0, 2), makeTask('C', 0, 1)];
    const deps: Dependency[] = [
      { id: 'd1', fromTaskId: 'A', toTaskId: 'B' },
      { id: 'd2', fromTaskId: 'B', toTaskId: 'C' },
      { id: 'd3', fromTaskId: 'C', toTaskId: 'B' }, // creates cycle B ↔ C
    ];
    const result = propagate(tasks, deps);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('cycle');
      expect(result.taskIds.sort()).toEqual(['B', 'C']);
    }
  });

  it('no cycle — existing tests still return ok: true', () => {
    const tasks = [makeTask('A', 0, 3), makeTask('B', 0, 2)];
    const deps: Dependency[] = [{ id: 'd1', fromTaskId: 'A', toTaskId: 'B' }];
    const result = propagate(tasks, deps);
    expect(result.ok).toBe(true);
  });
});

describe('getTaskEnd', () => {
  it('returns start + duration', () => {
    expect(getTaskEnd(5, 3)).toBe(8);
  });
});
