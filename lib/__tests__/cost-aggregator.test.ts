import { aggregateCosts } from '@/lib/cost-aggregator';
import type { ListRunItem } from '@/services/api/runs';

function makeRun(overrides: Partial<ListRunItem> = {}): ListRunItem {
  return {
    id: 'run_1',
    status: 'COMPLETED',
    taskIdentifier: 'my-task',
    env: { id: 'env_1', name: 'production', type: 'PRODUCTION' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:01:00Z',
    ...overrides,
  } as ListRunItem;
}

describe('aggregateCosts', () => {
  it('returns zeros for empty array', () => {
    const result = aggregateCosts([]);
    expect(result.totalCostCents).toBe(0);
    expect(result.totalBaseCostCents).toBe(0);
    expect(result.totalRuns).toBe(0);
    expect(result.byTask).toEqual([]);
  });

  it('sums costs across runs', () => {
    const runs = [
      makeRun({ costInCents: 10, baseCostInCents: 2 }),
      makeRun({ id: 'run_2', costInCents: 20, baseCostInCents: 5 }),
      makeRun({ id: 'run_3', costInCents: 30, baseCostInCents: 8 }),
    ];
    const result = aggregateCosts(runs);
    expect(result.totalCostCents).toBe(60);
    expect(result.totalBaseCostCents).toBe(15);
    expect(result.totalRuns).toBe(3);
  });

  it('groups by task identifier', () => {
    const runs = [
      makeRun({ id: 'run_1', taskIdentifier: 'task-a', costInCents: 10, baseCostInCents: 1 }),
      makeRun({ id: 'run_2', taskIdentifier: 'task-b', costInCents: 5, baseCostInCents: 1 }),
      makeRun({ id: 'run_3', taskIdentifier: 'task-a', costInCents: 15, baseCostInCents: 2 }),
    ];
    const result = aggregateCosts(runs);
    expect(result.byTask).toHaveLength(2);
    expect(result.byTask[0].taskIdentifier).toBe('task-a');
    expect(result.byTask[0].totalCostCents).toBe(25);
    expect(result.byTask[0].totalBaseCostCents).toBe(3);
    expect(result.byTask[0].runCount).toBe(2);
    expect(result.byTask[1].taskIdentifier).toBe('task-b');
    expect(result.byTask[1].totalCostCents).toBe(5);
    expect(result.byTask[1].runCount).toBe(1);
  });

  it('sorts by most expensive first', () => {
    const runs = [
      makeRun({ id: 'run_1', taskIdentifier: 'cheap', costInCents: 1 }),
      makeRun({ id: 'run_2', taskIdentifier: 'expensive', costInCents: 100 }),
      makeRun({ id: 'run_3', taskIdentifier: 'medium', costInCents: 50 }),
    ];
    const result = aggregateCosts(runs);
    expect(result.byTask.map((t) => t.taskIdentifier)).toEqual([
      'expensive',
      'medium',
      'cheap',
    ]);
  });

  it('treats null costInCents as 0', () => {
    const runs = [
      makeRun({ costInCents: undefined, baseCostInCents: undefined }),
      makeRun({ id: 'run_2', costInCents: 10, baseCostInCents: 3 }),
    ];
    const result = aggregateCosts(runs);
    expect(result.totalCostCents).toBe(10);
    expect(result.totalBaseCostCents).toBe(3);
    expect(result.totalRuns).toBe(2);
  });

  it('handles all null costs', () => {
    const runs = [
      makeRun({ costInCents: undefined, baseCostInCents: undefined }),
      makeRun({ id: 'run_2', costInCents: undefined, baseCostInCents: undefined }),
    ];
    const result = aggregateCosts(runs);
    expect(result.totalCostCents).toBe(0);
    expect(result.totalBaseCostCents).toBe(0);
    expect(result.byTask[0].totalCostCents).toBe(0);
  });
});
