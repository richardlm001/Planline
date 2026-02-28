import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { SidebarGroupRow } from '../SidebarGroupRow';
import type { Group } from '../../../domain/types';

const testGroup: Group = {
  id: 'g1',
  name: 'Sprint 1',
  collapsed: false,
  sortOrder: 0,
};

beforeEach(() => {
  useProjectStore.setState({
    tasks: [],
    dependencies: [],
    groups: [testGroup],
    project: { id: 'default', name: 'Project 01', epoch: '2024-01-01' },
    computedStarts: new Map(),
    scheduleError: null,
    cycleTaskIds: [],
    selectedTaskId: null,
    editingTaskId: null,
    linkingFromTaskId: null,
    lastSavedAt: null,
    isLoaded: true,
    hydrationError: null,
    persistError: null,
  });
});

describe('SidebarGroupRow', () => {
  it('renders group name', () => {
    render(<SidebarGroupRow group={testGroup} />);
    expect(screen.getByText('Sprint 1')).toBeTruthy();
  });

  it('shows collapse toggle', () => {
    render(<SidebarGroupRow group={testGroup} />);
    const toggle = screen.getByTestId('group-toggle-g1');
    expect(toggle).toBeTruthy();
    // Expanded state shows ▾
    expect(toggle.textContent).toBe('▾');
  });

  it('clicking toggle collapses/expands the group', () => {
    render(<SidebarGroupRow group={testGroup} />);
    const toggle = screen.getByTestId('group-toggle-g1');
    fireEvent.click(toggle);
    expect(useProjectStore.getState().groups[0].collapsed).toBe(true);
  });

  it('collapsed group shows ▸ indicator', () => {
    const collapsed = { ...testGroup, collapsed: true };
    useProjectStore.setState({ groups: [collapsed] });
    render(<SidebarGroupRow group={collapsed} />);
    const toggle = screen.getByTestId('group-toggle-g1');
    expect(toggle.textContent).toBe('▸');
  });

  it('double-click enables inline rename', () => {
    render(<SidebarGroupRow group={testGroup} />);
    const row = screen.getByTestId('group-row-g1');
    fireEvent.doubleClick(row);
    const input = screen.getByDisplayValue('Sprint 1') as HTMLInputElement;
    expect(input).toBeTruthy();
  });

  it('renaming and pressing Enter saves the new name', () => {
    render(<SidebarGroupRow group={testGroup} />);
    fireEvent.doubleClick(screen.getByTestId('group-row-g1'));
    const input = screen.getByDisplayValue('Sprint 1') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Sprint 2' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(useProjectStore.getState().groups[0].name).toBe('Sprint 2');
  });

  it('pressing Escape cancels rename', () => {
    render(<SidebarGroupRow group={testGroup} />);
    fireEvent.doubleClick(screen.getByTestId('group-row-g1'));
    const input = screen.getByDisplayValue('Sprint 1') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    // Name should not have changed
    expect(useProjectStore.getState().groups[0].name).toBe('Sprint 1');
  });
});
