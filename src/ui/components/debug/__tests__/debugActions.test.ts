import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { PlanlineDB } from '../../../../db/db';
import { factoryReset, prefillData } from '../debugActions';
import { useProjectStore } from '../../../../store/useProjectStore';

// We need a fresh DB for each test to avoid cross-contamination.
// The debugActions module imports `db` from '../../../../db/db', so we
// replace it by re-initialising the module-level instance.
let db: PlanlineDB;

beforeEach(async () => {
  // Reset the shared DB with a fresh instance
  const dbModule = await import('../../../../db/db');
  db = dbModule.db;
  await db.delete();
  await db.open();

  // Reset store
  useProjectStore.setState({
    tasks: [],
    dependencies: [],
    groups: [],
    project: { id: 'default', name: 'Project 01', epoch: '2024-01-01' },
    computedStarts: new Map(),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskIds: [],
    selectionAnchorId: null,
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
    hydrationError: null,
    persistError: null,
  });
});

describe('debugActions', () => {
  describe('factoryReset', () => {
    it('clears all DB tables and re-hydrates store', async () => {
      // Seed some data
      await db.tasks.put({
        id: 't1',
        name: 'task',
        startDayIndex: 0,
        durationDays: 1,
        color: '#C8D9FA',
        sortOrder: 0,
      });
      await db.groups.put({ id: 'g1', name: 'grp', collapsed: false, sortOrder: 0 });
      await db.dependencies.put({ id: 'd1', fromTaskId: 't1', toTaskId: 't1' });

      await factoryReset();

      expect(await db.tasks.count()).toBe(0);
      expect(await db.dependencies.count()).toBe(0);
      expect(await db.groups.count()).toBe(0);

      const state = useProjectStore.getState();
      expect(state.tasks).toHaveLength(0);
      expect(state.dependencies).toHaveLength(0);
      expect(state.groups).toHaveLength(0);
    });
  });

  describe('prefillData', () => {
    it('populates DB with small preset', async () => {
      await prefillData('small');

      expect(await db.tasks.count()).toBe(8);
      expect(await db.groups.count()).toBe(2);
      expect(await db.dependencies.count()).toBeGreaterThanOrEqual(1);

      const state = useProjectStore.getState();
      expect(state.tasks).toHaveLength(8);
      expect(state.groups).toHaveLength(2);
      expect(state.project.name).toContain('Small');
    });

    it('populates DB with medium preset', async () => {
      await prefillData('medium');

      expect(await db.tasks.count()).toBe(30);
      expect(await db.groups.count()).toBe(5);

      const state = useProjectStore.getState();
      expect(state.tasks).toHaveLength(30);
      expect(state.project.name).toContain('Medium');
    });

    it('populates DB with large preset', async () => {
      await prefillData('large');

      expect(await db.tasks.count()).toBe(100);
      expect(await db.groups.count()).toBe(10);

      const state = useProjectStore.getState();
      expect(state.tasks).toHaveLength(100);
      expect(state.project.name).toContain('Large');
    });
  });
});
