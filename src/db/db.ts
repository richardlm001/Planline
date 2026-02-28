import Dexie, { type Table } from 'dexie';
import type { Task, Dependency, Group, Project } from '../domain/types';

export class PlanlineDB extends Dexie {
  tasks!: Table<Task, string>;
  dependencies!: Table<Dependency, string>;
  groups!: Table<Group, string>;
  project!: Table<Project, string>;

  constructor() {
    super('planline');
    this.version(1).stores({
      tasks: 'id, groupId, sortOrder',
      dependencies: 'id, fromTaskId, toTaskId',
      groups: 'id, sortOrder',
      project: 'id',
    });
  }
}

export const db = new PlanlineDB();
