import type { ListRunItem } from '@/services/api/runs';

export interface TaskCostBreakdown {
  taskIdentifier: string;
  totalCostCents: number;
  totalBaseCostCents: number;
  runCount: number;
}

export interface CostSummary {
  totalCostCents: number;
  totalBaseCostCents: number;
  totalRuns: number;
  byTask: TaskCostBreakdown[];
}

export function aggregateCosts(runs: ListRunItem[]): CostSummary {
  let totalCostCents = 0;
  let totalBaseCostCents = 0;
  const taskMap = new Map<string, TaskCostBreakdown>();

  for (const run of runs) {
    const cost = run.costInCents ?? 0;
    const baseCost = run.baseCostInCents ?? 0;
    totalCostCents += cost;
    totalBaseCostCents += baseCost;

    const existing = taskMap.get(run.taskIdentifier);
    if (existing) {
      existing.totalCostCents += cost;
      existing.totalBaseCostCents += baseCost;
      existing.runCount += 1;
    } else {
      taskMap.set(run.taskIdentifier, {
        taskIdentifier: run.taskIdentifier,
        totalCostCents: cost,
        totalBaseCostCents: baseCost,
        runCount: 1,
      });
    }
  }

  const byTask = Array.from(taskMap.values()).sort(
    (a, b) => b.totalCostCents - a.totalCostCents
  );

  return {
    totalCostCents,
    totalBaseCostCents,
    totalRuns: runs.length,
    byTask,
  };
}
