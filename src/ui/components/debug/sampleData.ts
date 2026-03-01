import { nanoid } from 'nanoid';
import type { Task, Dependency, Group, Project } from '../../../domain/types';
import { COLOR_PALETTE, todayDayIndex } from '../../../domain/constants';

export interface SampleProject {
  tasks: Task[];
  groups: Group[];
  dependencies: Dependency[];
  project: Project;
}

// Curated realistic task names by category
const TASK_NAMES: Record<string, string[]> = {
  Design: [
    'User research interviews',
    'Design mockups',
    'Design system audit',
    'Wireframe review',
    'Visual polish pass',
    'Icon & asset export',
    'Accessibility review',
    'Prototype walkthrough',
    'Color palette refinement',
    'Typography selection',
  ],
  Backend: [
    'Database schema design',
    'API endpoint scaffolding',
    'Authentication service',
    'Rate limiter middleware',
    'Data migration script',
    'Cache layer setup',
    'Logging infrastructure',
    'Background job queue',
    'REST → GraphQL adapter',
    'Webhook handler',
  ],
  Frontend: [
    'Component library setup',
    'Routing & navigation',
    'Form validation logic',
    'State management wiring',
    'Responsive layout pass',
    'Dark mode support',
    'Error boundary setup',
    'Loading skeleton screens',
    'Animations & transitions',
    'Search autocomplete widget',
  ],
  QA: [
    'QA test plan',
    'Regression test suite',
    'Smoke tests',
    'Performance benchmarks',
    'Cross-browser testing',
    'Mobile device testing',
    'Accessibility audit',
    'Edge-case coverage',
    'Load testing',
    'Security scan',
  ],
  DevOps: [
    'CI/CD pipeline setup',
    'Docker containerization',
    'Staging env provisioning',
    'SSL certificate config',
    'Monitoring dashboards',
    'Alerting rules',
    'CDN configuration',
    'Backup & restore drill',
    'Infrastructure as code',
    'Log aggregation setup',
  ],
  Planning: [
    'Sprint planning',
    'Backlog grooming',
    'Stakeholder demo',
    'Retrospective',
    'Roadmap review',
    'Risk assessment',
    'Capacity planning',
    'Release checklist',
    'Kick-off meeting',
    'Post-mortem analysis',
  ],
  Data: [
    'ETL pipeline design',
    'Data warehouse modeling',
    'Analytics dashboard',
    'Report generation',
    'Data quality checks',
    'A/B test setup',
    'Metrics instrumentation',
    'Data retention policy',
    'ML model training run',
    'Feature flag rollout',
  ],
  Mobile: [
    'Push notification setup',
    'Offline sync logic',
    'App store submission',
    'Deep linking config',
    'Crash reporting setup',
    'Gesture navigation',
    'Biometric auth flow',
    'In-app purchase flow',
    'App performance audit',
    'Tablet layout adaptation',
  ],
};

const GROUP_POOLS: string[][] = [
  ['Design', 'Backend', 'Frontend', 'QA', 'DevOps'],
  ['Planning', 'Design', 'Backend', 'Frontend', 'QA', 'DevOps', 'Data'],
  ['Planning', 'Design', 'Backend', 'Frontend', 'QA', 'DevOps', 'Data', 'Mobile', 'Design', 'Backend'],
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildProject(
  groupCount: number,
  taskCount: number,
  depCount: number,
  label: string,
  groupPoolIndex: number,
): SampleProject {
  const baseline = todayDayIndex();
  const pool = GROUP_POOLS[groupPoolIndex];

  // Create groups
  const groups: Group[] = [];
  for (let i = 0; i < groupCount; i++) {
    groups.push({
      id: nanoid(),
      name: pool[i % pool.length],
      collapsed: false,
      sortOrder: i,
    });
  }

  // Create tasks distributed across groups
  const tasks: Task[] = [];
  for (let i = 0; i < taskCount; i++) {
    const group = groups[i % groups.length];
    const groupName = group.name;
    const namesForGroup = TASK_NAMES[groupName] ?? TASK_NAMES['Frontend'];
    const nameIndex = Math.floor(i / groups.length) % namesForGroup.length;

    tasks.push({
      id: nanoid(),
      name: namesForGroup[nameIndex],
      startDayIndex: baseline + randomInt(-5, 20),
      durationDays: randomInt(1, 15),
      groupId: group.id,
      color: COLOR_PALETTE[i % COLOR_PALETTE.length],
      sortOrder: i,
    });
  }

  // Create valid FS dependencies (acyclic)
  // Strategy: only create deps from task[i] → task[j] where i < j
  const dependencies: Dependency[] = [];
  const usedPairs = new Set<string>();
  let attempts = 0;
  const maxAttempts = depCount * 5;

  while (dependencies.length < depCount && attempts < maxAttempts) {
    attempts++;
    const fromIdx = randomInt(0, tasks.length - 2);
    const toIdx = randomInt(fromIdx + 1, tasks.length - 1);
    const key = `${fromIdx}-${toIdx}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);

    dependencies.push({
      id: nanoid(),
      fromTaskId: tasks[fromIdx].id,
      toTaskId: tasks[toIdx].id,
    });
  }

  const project: Project = {
    id: 'default',
    name: `Sample Project (${label})`,
    epoch: '2024-01-01',
  };

  return { tasks, groups, dependencies, project };
}

export function generateSmallProject(): SampleProject {
  return buildProject(2, 8, 5, 'Small', 0);
}

export function generateMediumProject(): SampleProject {
  return buildProject(5, 30, 20, 'Medium', 1);
}

export function generateLargeProject(): SampleProject {
  return buildProject(10, 100, 60, 'Large', 2);
}
