import { create } from 'zustand';
import { sub, type Duration } from 'date-fns';

export type PeriodPreset = '1h' | '24h' | '7d' | '30d';

interface FiltersState {
  statusFilter: string[];
  taskFilter: string[];
  tagFilter: string[];
  periodFilter: PeriodPreset | null;
  createdAtFrom: string | null;
  createdAtTo: string | null;
  versionFilter: string | null;
  batchFilter: string | null;
  scheduleFilter: string | null;
  searchQuery: string;

  // Selection mode
  isSelectMode: boolean;
  selectedRunIds: Set<string>;

  setStatusFilter: (statuses: string[]) => void;
  setTaskFilter: (tasks: string[]) => void;
  setTagFilter: (tags: string[]) => void;
  setPeriodFilter: (period: PeriodPreset | null) => void;
  setVersionFilter: (version: string | null) => void;
  setBatchFilter: (batchId: string | null) => void;
  setScheduleFilter: (scheduleId: string | null) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;
  resetWithStatusFilter: (statuses: string[]) => void;

  toggleSelectMode: () => void;
  toggleRunSelection: (runId: string) => void;
  selectAll: (runIds: string[]) => void;
  clearSelection: () => void;
}

function computeDateRange(period: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const durationMap: Record<PeriodPreset, Duration> = {
    '1h': { hours: 1 },
    '24h': { hours: 24 },
    '7d': { days: 7 },
    '30d': { days: 30 },
  };
  return {
    from: sub(now, durationMap[period]).toISOString(),
    to: now.toISOString(),
  };
}

const defaultState = {
  statusFilter: [] as string[],
  taskFilter: [] as string[],
  tagFilter: [] as string[],
  periodFilter: null as PeriodPreset | null,
  createdAtFrom: null as string | null,
  createdAtTo: null as string | null,
  versionFilter: null as string | null,
  batchFilter: null as string | null,
  scheduleFilter: null as string | null,
  searchQuery: '',
  isSelectMode: false,
  selectedRunIds: new Set<string>(),
};

export const useFiltersStore = create<FiltersState>((set) => ({
  ...defaultState,

  setStatusFilter: (statuses) => set({ statusFilter: statuses }),
  setTaskFilter: (tasks) => set({ taskFilter: tasks }),
  setTagFilter: (tags) => set({ tagFilter: tags }),
  setPeriodFilter: (period) => {
    if (period) {
      const { from, to } = computeDateRange(period);
      set({ periodFilter: period, createdAtFrom: from, createdAtTo: to });
    } else {
      set({ periodFilter: null, createdAtFrom: null, createdAtTo: null });
    }
  },
  setVersionFilter: (version) => set({ versionFilter: version }),
  setBatchFilter: (batchId) => set({ batchFilter: batchId }),
  setScheduleFilter: (scheduleId) => set({ scheduleFilter: scheduleId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearAllFilters: () => set({ ...defaultState, selectedRunIds: new Set() }),
  resetWithStatusFilter: (statuses) =>
    set({ ...defaultState, selectedRunIds: new Set(), statusFilter: statuses }),

  toggleSelectMode: () =>
    set((state) => ({
      isSelectMode: !state.isSelectMode,
      selectedRunIds: state.isSelectMode ? new Set<string>() : state.selectedRunIds,
    })),
  toggleRunSelection: (runId) =>
    set((state) => {
      const next = new Set(state.selectedRunIds);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
      }
      return { selectedRunIds: next };
    }),
  selectAll: (runIds) => set({ selectedRunIds: new Set(runIds) }),
  clearSelection: () => set({ selectedRunIds: new Set() }),
}));

export function hasActiveFilters(): boolean {
  const s = useFiltersStore.getState();
  return (
    s.statusFilter.length > 0 ||
    s.taskFilter.length > 0 ||
    s.tagFilter.length > 0 ||
    s.periodFilter !== null ||
    s.versionFilter !== null ||
    s.batchFilter !== null ||
    s.scheduleFilter !== null
  );
}

export function selectedCount(): number {
  return useFiltersStore.getState().selectedRunIds.size;
}

export function activeFilterCount(): number {
  const s = useFiltersStore.getState();
  let count = 0;
  if (s.statusFilter.length > 0) count++;
  if (s.taskFilter.length > 0) count++;
  if (s.tagFilter.length > 0) count++;
  if (s.periodFilter !== null) count++;
  if (s.versionFilter !== null) count++;
  if (s.batchFilter !== null) count++;
  if (s.scheduleFilter !== null) count++;
  return count;
}
