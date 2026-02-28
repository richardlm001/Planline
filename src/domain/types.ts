export interface Task {
  id: string;
  name: string;
  startDayIndex: number;
  durationDays: number;
  groupId?: string;
  color: string;
  sortOrder: number;
}

export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
}

export interface Group {
  id: string;
  name: string;
  collapsed: boolean;
  sortOrder: number;
}

export interface Project {
  id: string;
  name: string;
  epoch: string;
}
