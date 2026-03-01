import { describe, it, expect } from 'vitest';
import { propagate } from '../../../../domain/scheduler';
import { COLOR_PALETTE } from '../../../../domain/constants';
import {
  generateSmallProject,
  generateMediumProject,
  generateLargeProject,
} from '../sampleData';
import type { SampleProject } from '../sampleData';

function validateProject(data: SampleProject, expectedLabel: string) {
  // Project label
  expect(data.project.name).toContain(expectedLabel);
  expect(data.project.id).toBe('default');

  // No duplicate task IDs
  const taskIds = data.tasks.map((t) => t.id);
  expect(new Set(taskIds).size).toBe(taskIds.length);

  // No duplicate group IDs
  const groupIds = data.groups.map((g) => g.id);
  expect(new Set(groupIds).size).toBe(groupIds.length);

  // No duplicate dependency IDs
  const depIds = data.dependencies.map((d) => d.id);
  expect(new Set(depIds).size).toBe(depIds.length);

  // All task colors are from COLOR_PALETTE
  for (const task of data.tasks) {
    expect(COLOR_PALETTE).toContain(task.color);
  }

  // All task groupIds reference valid groups
  const groupIdSet = new Set(groupIds);
  for (const task of data.tasks) {
    if (task.groupId) {
      expect(groupIdSet.has(task.groupId)).toBe(true);
    }
  }

  // All dependency task IDs reference valid tasks
  const taskIdSet = new Set(taskIds);
  for (const dep of data.dependencies) {
    expect(taskIdSet.has(dep.fromTaskId)).toBe(true);
    expect(taskIdSet.has(dep.toTaskId)).toBe(true);
  }

  // No self-dependencies
  for (const dep of data.dependencies) {
    expect(dep.fromTaskId).not.toBe(dep.toTaskId);
  }

  // No cyclic dependencies — scheduler must succeed
  const result = propagate(data.tasks, data.dependencies);
  expect(result.ok).toBe(true);
}

describe('sampleData generators', () => {
  describe('generateSmallProject', () => {
    it('produces ~8 tasks and 2 groups with valid data', () => {
      const data = generateSmallProject();
      expect(data.tasks.length).toBe(8);
      expect(data.groups.length).toBe(2);
      expect(data.dependencies.length).toBeGreaterThanOrEqual(1);
      expect(data.dependencies.length).toBeLessThanOrEqual(8);
      validateProject(data, 'Small');
    });
  });

  describe('generateMediumProject', () => {
    it('produces ~30 tasks and 5 groups with valid data', () => {
      const data = generateMediumProject();
      expect(data.tasks.length).toBe(30);
      expect(data.groups.length).toBe(5);
      expect(data.dependencies.length).toBeGreaterThanOrEqual(10);
      expect(data.dependencies.length).toBeLessThanOrEqual(30);
      validateProject(data, 'Medium');
    });
  });

  describe('generateLargeProject', () => {
    it('produces ~100 tasks and 10 groups with valid data', () => {
      const data = generateLargeProject();
      expect(data.tasks.length).toBe(100);
      expect(data.groups.length).toBe(10);
      expect(data.dependencies.length).toBeGreaterThanOrEqual(30);
      expect(data.dependencies.length).toBeLessThanOrEqual(100);
      validateProject(data, 'Large');
    });
  });
});
