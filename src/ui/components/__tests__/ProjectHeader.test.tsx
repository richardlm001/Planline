import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { ProjectHeader } from '../ProjectHeader';

beforeEach(() => {
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
  });
});

describe('ProjectHeader', () => {
  it('displays the default project name', () => {
    render(<ProjectHeader />);
    expect(screen.getByText('Project 01')).toBeTruthy();
  });

  it('allows inline editing of the project name', () => {
    render(<ProjectHeader />);
    fireEvent.click(screen.getByTestId('project-name'));

    const input = screen.getByTestId('project-name-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'My Project' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(useProjectStore.getState().project.name).toBe('My Project');
  });
});
