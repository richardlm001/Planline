import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { SavedIndicator } from '../SavedIndicator';

beforeEach(() => {
  useProjectStore.setState({
    tasks: [],
    dependencies: [],
    groups: [],
    project: { id: 'default', name: 'Project 01', epoch: '2024-01-01' },
    computedStarts: new Map(),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskId: null,
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
  });
});

describe('SavedIndicator', () => {
  it('shows "Not yet saved" when lastSavedAt is null', () => {
    render(<SavedIndicator />);
    expect(screen.getByText('Not yet saved')).toBeTruthy();
  });

  it('shows "Saved on device" when lastSavedAt is set', () => {
    useProjectStore.setState({ lastSavedAt: new Date() });
    render(<SavedIndicator />);
    expect(screen.getByText('Saved on device')).toBeTruthy();
  });
});
