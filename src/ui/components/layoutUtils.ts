import type { Task, Group } from '../../domain/types';

export type VisualRowItem =
  | { type: 'task'; task: Task }
  | { type: 'group-header'; group: Group };

export interface VisualRowMap {
  /** Map from taskId to visual row index (accounting for group headers) */
  taskRowIndex: Map<string, number>;
  /** Map from groupId to its header's visual row index */
  groupHeaderRowIndex: Map<string, number>;
  /** Ordered list of visible tasks (matching sidebar order, excluding collapsed) */
  visibleTasks: Task[];
  /** Total number of visual rows (including group headers) */
  totalVisualRows: number;
  /** Per-row items for hit-testing (e.g., vertical drag drop) */
  rowItems: VisualRowItem[];
}

/**
 * Build a visual row mapping that matches the sidebar's rendering order.
 * Top-level items (ungrouped tasks and group headers) are interleaved
 * by sortOrder. Each group header is followed by its children (sorted
 * by task sortOrder) unless the group is collapsed.
 */
export function buildVisualRowMap(
  tasks: Task[],
  groups: Group[],
  collapsedGroupIds: Set<string>,
): VisualRowMap {
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);

  const ungrouped = sortedTasks.filter((t) => !t.groupId);
  const grouped = new Map<string, Task[]>();
  for (const t of sortedTasks) {
    if (t.groupId) {
      const arr = grouped.get(t.groupId) ?? [];
      arr.push(t);
      grouped.set(t.groupId, arr);
    }
  }

  // Build a unified list of top-level entries sorted by sortOrder
  type TopLevelEntry =
    | { type: 'task'; task: Task; sortOrder: number }
    | { type: 'group'; group: Group; sortOrder: number };

  const topLevel: TopLevelEntry[] = [
    ...ungrouped.map((task) => ({ type: 'task' as const, task, sortOrder: task.sortOrder })),
    ...([...groups].map((group) => ({ type: 'group' as const, group, sortOrder: group.sortOrder }))),
  ];
  topLevel.sort((a, b) => a.sortOrder - b.sortOrder);

  const taskRowIndex = new Map<string, number>();
  const groupHeaderRowIndex = new Map<string, number>();
  const visibleTasks: Task[] = [];
  const rowItems: VisualRowItem[] = [];
  let currentRow = 0;

  for (const entry of topLevel) {
    if (entry.type === 'task') {
      taskRowIndex.set(entry.task.id, currentRow);
      visibleTasks.push(entry.task);
      rowItems.push({ type: 'task', task: entry.task });
      currentRow++;
    } else {
      groupHeaderRowIndex.set(entry.group.id, currentRow);
      rowItems.push({ type: 'group-header', group: entry.group });
      currentRow++;

      if (!collapsedGroupIds.has(entry.group.id)) {
        const children = grouped.get(entry.group.id) ?? [];
        for (const task of children) {
          taskRowIndex.set(task.id, currentRow);
          visibleTasks.push(task);
          rowItems.push({ type: 'task', task });
          currentRow++;
        }
      }
    }
  }

  return { taskRowIndex, groupHeaderRowIndex, visibleTasks, totalVisualRows: currentRow, rowItems };
}
