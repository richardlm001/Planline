import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { useProjectStore } from '../../../store/useProjectStore';
import { ZoomToggle } from '../ZoomToggle';
import { ZOOM_PRESETS, DEFAULT_ZOOM_PRESET_INDEX, MAX_ZOOM_PRESET_INDEX } from '../../constants';

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
    zoomLevel: 'day',
    zoomPresetIndex: DEFAULT_ZOOM_PRESET_INDEX,
    lastSavedAt: null,
    isLoaded: true,
    hydrationError: null,
    persistError: null,
  });
});

describe('ZoomToggle', () => {
  it('renders a slider and label', () => {
    render(<ZoomToggle />);
    expect(screen.getByTestId('zoom-slider')).toBeTruthy();
    expect(screen.getByTestId('zoom-label')).toBeTruthy();
  });

  it('shows "Days" label at default preset (day view)', () => {
    render(<ZoomToggle />);
    expect(screen.getByTestId('zoom-label').textContent).toBe('Days');
  });

  it('slider value matches default preset index', () => {
    render(<ZoomToggle />);
    const slider = screen.getByTestId('zoom-slider') as HTMLInputElement;
    expect(Number(slider.value)).toBe(DEFAULT_ZOOM_PRESET_INDEX);
  });

  it('moving slider to a week preset updates store and shows "Weeks"', () => {
    render(<ZoomToggle />);
    const weekPresetIndex = ZOOM_PRESETS.findIndex(p => p.viewMode === 'week');
    const slider = screen.getByTestId('zoom-slider');
    fireEvent.change(slider, { target: { value: String(weekPresetIndex) } });

    const state = useProjectStore.getState();
    expect(state.zoomPresetIndex).toBe(weekPresetIndex);
    expect(state.zoomLevel).toBe('week');
  });

  it('moving slider to max shows "Months" label', () => {
    render(<ZoomToggle />);
    const slider = screen.getByTestId('zoom-slider');
    fireEvent.change(slider, { target: { value: String(MAX_ZOOM_PRESET_INDEX) } });

    const state = useProjectStore.getState();
    expect(state.zoomLevel).toBe('month');
    expect(state.zoomPresetIndex).toBe(MAX_ZOOM_PRESET_INDEX);
  });

  it('moving slider to 0 shows most zoomed-in day view', () => {
    render(<ZoomToggle />);
    const slider = screen.getByTestId('zoom-slider');
    fireEvent.change(slider, { target: { value: '0' } });

    const state = useProjectStore.getState();
    expect(state.zoomPresetIndex).toBe(0);
    expect(state.zoomLevel).toBe('day');
  });

  it('slider has correct min and max attributes', () => {
    render(<ZoomToggle />);
    const slider = screen.getByTestId('zoom-slider') as HTMLInputElement;
    expect(slider.min).toBe('0');
    expect(slider.max).toBe(String(MAX_ZOOM_PRESET_INDEX));
  });

  it('clicking zoom-in button decreases preset index', () => {
    useProjectStore.setState({ zoomPresetIndex: 3, zoomLevel: 'day' });
    render(<ZoomToggle />);
    fireEvent.click(screen.getByTestId('zoom-in-button'));
    expect(useProjectStore.getState().zoomPresetIndex).toBe(2);
  });

  it('clicking zoom-out button increases preset index', () => {
    render(<ZoomToggle />);
    fireEvent.click(screen.getByTestId('zoom-out-button'));
    expect(useProjectStore.getState().zoomPresetIndex).toBe(DEFAULT_ZOOM_PRESET_INDEX + 1);
  });

  it('zoom-in button is disabled at preset index 0', () => {
    useProjectStore.setState({ zoomPresetIndex: 0, zoomLevel: 'day' });
    render(<ZoomToggle />);
    expect(screen.getByTestId('zoom-in-button')).toBeDisabled();
  });

  it('zoom-out button is disabled at max preset index', () => {
    useProjectStore.setState({ zoomPresetIndex: MAX_ZOOM_PRESET_INDEX, zoomLevel: 'month' });
    render(<ZoomToggle />);
    expect(screen.getByTestId('zoom-out-button')).toBeDisabled();
  });

  it('zoom-in button does nothing when already at index 0', () => {
    useProjectStore.setState({ zoomPresetIndex: 0, zoomLevel: 'day' });
    render(<ZoomToggle />);
    fireEvent.click(screen.getByTestId('zoom-in-button'));
    expect(useProjectStore.getState().zoomPresetIndex).toBe(0);
  });

  it('zoom-out button does nothing when already at max', () => {
    useProjectStore.setState({ zoomPresetIndex: MAX_ZOOM_PRESET_INDEX, zoomLevel: 'month' });
    render(<ZoomToggle />);
    fireEvent.click(screen.getByTestId('zoom-out-button'));
    expect(useProjectStore.getState().zoomPresetIndex).toBe(MAX_ZOOM_PRESET_INDEX);
  });
});
