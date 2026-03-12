import { useFiltersStore, hasActiveFilters, activeFilterCount, selectedCount } from '@/stores/filters-store';

const initialState = useFiltersStore.getState();

beforeEach(() => {
  useFiltersStore.setState(initialState);
});

describe('filters store', () => {
  it('starts with no active filters', () => {
    expect(hasActiveFilters()).toBe(false);
    expect(activeFilterCount()).toBe(0);
  });

  it('setStatusFilter sets status filter', () => {
    useFiltersStore.getState().setStatusFilter(['COMPLETED', 'FAILED']);
    expect(useFiltersStore.getState().statusFilter).toEqual(['COMPLETED', 'FAILED']);
    expect(hasActiveFilters()).toBe(true);
    expect(activeFilterCount()).toBe(1);
  });

  it('setTaskFilter sets task filter', () => {
    useFiltersStore.getState().setTaskFilter(['my-task']);
    expect(useFiltersStore.getState().taskFilter).toEqual(['my-task']);
    expect(hasActiveFilters()).toBe(true);
  });

  it('setTagFilter sets tag filter', () => {
    useFiltersStore.getState().setTagFilter(['user_123']);
    expect(useFiltersStore.getState().tagFilter).toEqual(['user_123']);
    expect(hasActiveFilters()).toBe(true);
  });

  it('setPeriodFilter computes date range', () => {
    useFiltersStore.getState().setPeriodFilter('24h');
    const state = useFiltersStore.getState();
    expect(state.periodFilter).toBe('24h');
    expect(state.createdAtFrom).toBeTruthy();
    expect(state.createdAtTo).toBeTruthy();
    // Verify the from date is approximately 24h ago
    const from = new Date(state.createdAtFrom!);
    const now = new Date();
    const diffHours = (now.getTime() - from.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(24, 0);
  });

  it('setPeriodFilter to null clears date range', () => {
    useFiltersStore.getState().setPeriodFilter('7d');
    useFiltersStore.getState().setPeriodFilter(null);
    const state = useFiltersStore.getState();
    expect(state.periodFilter).toBeNull();
    expect(state.createdAtFrom).toBeNull();
    expect(state.createdAtTo).toBeNull();
  });

  it('setVersionFilter sets version filter', () => {
    useFiltersStore.getState().setVersionFilter('20240523.1');
    expect(useFiltersStore.getState().versionFilter).toBe('20240523.1');
    expect(hasActiveFilters()).toBe(true);
  });

  it('setBatchFilter sets batch filter', () => {
    useFiltersStore.getState().setBatchFilter('bulk_123');
    expect(useFiltersStore.getState().batchFilter).toBe('bulk_123');
  });

  it('setScheduleFilter sets schedule filter', () => {
    useFiltersStore.getState().setScheduleFilter('schedule_456');
    expect(useFiltersStore.getState().scheduleFilter).toBe('schedule_456');
  });

  it('clearAllFilters resets everything', () => {
    useFiltersStore.getState().setStatusFilter(['FAILED']);
    useFiltersStore.getState().setTaskFilter(['my-task']);
    useFiltersStore.getState().setTagFilter(['tag1']);
    useFiltersStore.getState().setPeriodFilter('7d');
    useFiltersStore.getState().setVersionFilter('v1');

    useFiltersStore.getState().clearAllFilters();

    const state = useFiltersStore.getState();
    expect(state.statusFilter).toEqual([]);
    expect(state.taskFilter).toEqual([]);
    expect(state.tagFilter).toEqual([]);
    expect(state.periodFilter).toBeNull();
    expect(state.createdAtFrom).toBeNull();
    expect(state.versionFilter).toBeNull();
    expect(hasActiveFilters()).toBe(false);
    expect(activeFilterCount()).toBe(0);
  });

  it('activeFilterCount counts each distinct filter type', () => {
    useFiltersStore.getState().setStatusFilter(['COMPLETED', 'FAILED']);
    useFiltersStore.getState().setTaskFilter(['task1', 'task2']);
    useFiltersStore.getState().setPeriodFilter('1h');
    expect(activeFilterCount()).toBe(3);
  });
});

describe('selection mode', () => {
  it('starts with select mode off and no selections', () => {
    expect(useFiltersStore.getState().isSelectMode).toBe(false);
    expect(selectedCount()).toBe(0);
  });

  it('toggleSelectMode enables select mode', () => {
    useFiltersStore.getState().toggleSelectMode();
    expect(useFiltersStore.getState().isSelectMode).toBe(true);
  });

  it('toggleSelectMode disables select mode and clears selection', () => {
    useFiltersStore.getState().toggleSelectMode(); // enable
    useFiltersStore.getState().toggleRunSelection('run_1');
    useFiltersStore.getState().toggleRunSelection('run_2');
    expect(selectedCount()).toBe(2);

    useFiltersStore.getState().toggleSelectMode(); // disable
    expect(useFiltersStore.getState().isSelectMode).toBe(false);
    expect(selectedCount()).toBe(0);
  });

  it('toggleRunSelection adds and removes runs', () => {
    useFiltersStore.getState().toggleRunSelection('run_1');
    expect(useFiltersStore.getState().selectedRunIds.has('run_1')).toBe(true);
    expect(selectedCount()).toBe(1);

    useFiltersStore.getState().toggleRunSelection('run_1');
    expect(useFiltersStore.getState().selectedRunIds.has('run_1')).toBe(false);
    expect(selectedCount()).toBe(0);
  });

  it('selectAll selects all provided IDs', () => {
    useFiltersStore.getState().selectAll(['run_1', 'run_2', 'run_3']);
    expect(selectedCount()).toBe(3);
  });

  it('clearSelection removes all selections', () => {
    useFiltersStore.getState().selectAll(['run_1', 'run_2']);
    useFiltersStore.getState().clearSelection();
    expect(selectedCount()).toBe(0);
  });
});
