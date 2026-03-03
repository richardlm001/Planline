import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import App from '../../App';

beforeEach(async () => {
  const { default: Dexie } = await import('dexie');
  await Dexie.delete('planline');
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

describe('Scroll Sync', () => {
  it('syncs sidebar scrollTop when timeline is scrolled', async () => {
    render(<App />);

    const sidebar = screen.getByTestId('sidebar-scroll');
    const timeline = screen.getByTestId('timeline-scroll');

    // Simulate scrolling the timeline
    timeline.scrollTop = 120;
    await act(async () => {
      fireEvent.scroll(timeline);
    });

    expect(sidebar.scrollTop).toBe(120);
  });

  it('syncs timeline scrollTop when sidebar is scrolled', async () => {
    render(<App />);

    const sidebar = screen.getByTestId('sidebar-scroll');
    const timeline = screen.getByTestId('timeline-scroll');

    // Simulate scrolling the sidebar
    sidebar.scrollTop = 80;
    await act(async () => {
      fireEvent.scroll(sidebar);
    });

    expect(timeline.scrollTop).toBe(80);
  });
});
