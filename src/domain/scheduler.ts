import type { Task, Dependency } from './types';

export type ScheduleResult =
  | { ok: true; starts: Map<string, number> }
  | { ok: false; error: 'cycle'; taskIds: string[] };

/** Returns the day index of the first day AFTER the task ends */
export function getTaskEnd(start: number, duration: number): number {
  return start + duration;
}

/**
 * Given tasks and dependencies, compute the effective startDayIndex for each
 * task after Finish-to-Start propagation. Detects cycles and returns an error.
 *
 * Algorithm:
 * 1. Build adjacency list of predecessors
 * 2. Topological sort (Kahn's algorithm) with cycle detection
 * 3. Walk in topological order and compute effective starts
 */
export function propagate(tasks: Task[], dependencies: Dependency[]): ScheduleResult {
  // Build maps for quick lookup
  const taskMap = new Map<string, Task>();
  for (const t of tasks) {
    taskMap.set(t.id, t);
  }

  // Build predecessor adjacency: predecessors[taskId] = [predecessorTaskId, ...]
  const predecessors = new Map<string, string[]>();
  // Build successor adjacency for topological sort: successors[taskId] = [successorTaskId, ...]
  const successors = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const t of tasks) {
    predecessors.set(t.id, []);
    successors.set(t.id, []);
    inDegree.set(t.id, 0);
  }

  // Populate from dependencies
  for (const dep of dependencies) {
    // Only process deps where both tasks exist
    if (!taskMap.has(dep.fromTaskId) || !taskMap.has(dep.toTaskId)) continue;

    predecessors.get(dep.toTaskId)!.push(dep.fromTaskId);
    successors.get(dep.fromTaskId)!.push(dep.toTaskId);
    inDegree.set(dep.toTaskId, (inDegree.get(dep.toTaskId) ?? 0) + 1);
  }

  // Kahn's algorithm for topological sort
  const queue: string[] = [];
  for (const t of tasks) {
    if (inDegree.get(t.id) === 0) {
      queue.push(t.id);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);

    for (const succ of successors.get(id) ?? []) {
      const newDegree = (inDegree.get(succ) ?? 1) - 1;
      inDegree.set(succ, newDegree);
      if (newDegree === 0) {
        queue.push(succ);
      }
    }
  }

  // Cycle detection: if not all tasks were sorted, there's a cycle
  if (sorted.length < tasks.length) {
    const sortedSet = new Set(sorted);
    const cycleTaskIds = tasks
      .filter((t) => !sortedSet.has(t.id))
      .map((t) => t.id);
    return { ok: false, error: 'cycle', taskIds: cycleTaskIds };
  }

  // Compute effective starts
  const starts = new Map<string, number>();

  for (const id of sorted) {
    const task = taskMap.get(id)!;
    const preds = predecessors.get(id) ?? [];

    let effectiveStart = task.startDayIndex;

    for (const predId of preds) {
      const predStart = starts.get(predId)!;
      const predTask = taskMap.get(predId)!;
      const predEnd = getTaskEnd(predStart, predTask.durationDays);
      if (predEnd > effectiveStart) {
        effectiveStart = predEnd;
      }
    }

    starts.set(id, effectiveStart);
  }

  return { ok: true, starts };
}
