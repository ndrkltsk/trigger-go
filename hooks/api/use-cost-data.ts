import { useQuery } from '@tanstack/react-query';
import { listProjectRuns, type ListRunItem } from '@/services/api/runs';
import { aggregateCosts, type CostSummary } from '@/lib/cost-aggregator';
import { useAuthStore } from '@/stores/auth-store';
import { usePreferencesStore } from '@/stores/preferences-store';

export type CostPeriod = '24h' | '7d' | '30d';

const PERIOD_MS: Record<CostPeriod, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const MAX_PAGES = 5;

export const costKeys = {
  all: ['costs'] as const,
  summary: (period: CostPeriod) => [...costKeys.all, 'summary', period] as const,
};

async function fetchAllRunsForPeriod(period: CostPeriod): Promise<ListRunItem[]> {
  const { projectRef } = useAuthStore.getState();
  const { selectedEnvironment } = usePreferencesStore.getState();

  if (!projectRef) return [];

  const from = new Date(Date.now() - PERIOD_MS[period]).toISOString();
  const allRuns: ListRunItem[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await listProjectRuns(projectRef, {
      createdAtFrom: from,
      pageSize: 100,
      after: cursor,
      env: [selectedEnvironment],
    });

    if (result.data) {
      allRuns.push(...result.data);
    }

    cursor = result.pagination?.next ?? undefined;
    if (!cursor) break;
  }

  return allRuns;
}

export function useCostData(period: CostPeriod) {
  const projectRef = useAuthStore((s) => s.projectRef);

  return useQuery<CostSummary>({
    queryKey: costKeys.summary(period),
    queryFn: async () => {
      const runs = await fetchAllRunsForPeriod(period);
      return aggregateCosts(runs);
    },
    enabled: !!projectRef,
    staleTime: 5 * 60 * 1000,
  });
}
