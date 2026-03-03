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
 * Build a visual row mapping that matches the sidebar's rendering order:
 * 1. Ungrouped tasks (sorted by sortOrder)
 * 2. For each group (sorted by group sortOrder):
 *    - Group header row (takes one row)
 *    - If not collapsed: group's children (sorted by task sortOrder)
 */
export function buildVisualRowMap(
  tasks: Task[],
  groups: Group[],
  collapsedGroupIds: Set<string>,
): VisualRowMap {
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  const ungrouped = sortedTasks.filter((t) => !t.groupId);
  const grouped = new Map<string, Task[]>();
  for (const t of sortedTasks) {
    if (t.groupId) {
      const arr = grouped.get(t.groupId) ?? [];
      arr.push(t);
      grouped.set(t.groupId, arr);
    }
  }

  const taskRowIndex = new Map<string, number>();
  const groupHeaderRowIndex = new Map<string, number>();
  const visibleTasks: Task[] = [];
  const rowItems: VisualRowItem[] = [];
  let currentRow = 0;

  // Ungrouped tasks first
  for (const task of ungrouped) {
    taskRowIndex.set(task.id, currentRow);
    visibleTasks.push(task);
    rowItems.push({ type: 'task', task });
    currentRow++;
  }

  // Groups with their children
  for (const group of sortedGroups) {
    groupHeaderRowIndex.set(group.id, currentRow);
    rowItems.push({ type: 'group-header', group });
    currentRow++; // group header takes a row

    if (!collapsedGroupIds.has(group.id)) {
      const children = grouped.get(group.id) ?? [];
      for (const task of children) {
        taskRowIndex.set(task.id, currentRow);
        visibleTasks.push(task);
        rowItems.push({ type: 'task', task });
        currentRow++;
      }
    }
  }

  return { taskRowIndex, groupHeaderRowIndex, visibleTasks, totalVisualRows: currentRow, rowItems };
}
