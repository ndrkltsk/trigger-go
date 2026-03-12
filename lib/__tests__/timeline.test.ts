import { buildTimeline, type TimelineNode } from '@/lib/timeline';

describe('buildTimeline', () => {
  const baseRun = {
    id: 'run_1',
    status: 'COMPLETED' as const,
    taskIdentifier: 'my-task',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:01:00Z',
    startedAt: '2025-01-01T00:00:05Z',
    finishedAt: '2025-01-01T00:01:00Z',
    attempts: [],
  };

  it('creates nodes for a completed run', () => {
    const timeline = buildTimeline(baseRun as any);
    expect(timeline.nodes.length).toBeGreaterThanOrEqual(3);

    const states = timeline.nodes.map((n) => n.state);
    expect(states).toContain('created');
    expect(states).toContain('executing');
    expect(states).toContain('completed');
  });

  it('marks the correct node as active for an executing run', () => {
    const run = {
      ...baseRun,
      status: 'EXECUTING' as const,
      finishedAt: undefined,
    };

    const timeline = buildTimeline(run as any);
    const activeNode = timeline.nodes.find((n) => n.isActive);
    expect(activeNode).toBeTruthy();
    expect(activeNode!.state).toBe('executing');
  });

  it('shows failed state for failed runs', () => {
    const run = {
      ...baseRun,
      status: 'FAILED' as const,
    };

    const timeline = buildTimeline(run as any);
    const lastNode = timeline.nodes[timeline.nodes.length - 1];
    expect(lastNode.state).toBe('failed');
    expect(lastNode.label).toBe('Failed');
  });

  it('shows canceled state', () => {
    const run = {
      ...baseRun,
      status: 'CANCELED' as const,
    };

    const timeline = buildTimeline(run as any);
    const lastNode = timeline.nodes[timeline.nodes.length - 1];
    expect(lastNode.state).toBe('canceled');
  });

  it('calculates durations between states', () => {
    const timeline = buildTimeline(baseRun as any);
    const createdNode = timeline.nodes.find((n) => n.state === 'created');
    // 5 seconds between created and started
    expect(createdNode!.duration).toBe(5000);

    const executingNode = timeline.nodes.find((n) => n.state === 'executing');
    // 55 seconds between started and finished
    expect(executingNode!.duration).toBe(55000);
  });

  it('includes queued node when there is a gap between created and started', () => {
    const run = {
      ...baseRun,
      createdAt: '2025-01-01T00:00:00Z',
      startedAt: '2025-01-01T00:00:10Z', // 10 seconds queue time
    };

    const timeline = buildTimeline(run as any);
    const states = timeline.nodes.map((n) => n.state);
    expect(states).toContain('queued');
  });

  it('includes delayed node when delayedUntil is set', () => {
    const run = {
      ...baseRun,
      delayedUntil: '2025-01-01T00:00:02Z',
    };

    const timeline = buildTimeline(run as any);
    const states = timeline.nodes.map((n) => n.state);
    expect(states).toContain('delayed');
  });

  it('handles child runs', () => {
    const run = {
      ...baseRun,
      relatedRuns: {
        children: [
          {
            id: 'run_child_1',
            status: 'COMPLETED',
            taskIdentifier: 'child-task',
            createdAt: '2025-01-01T00:00:10Z',
            updatedAt: '2025-01-01T00:00:30Z',
            startedAt: '2025-01-01T00:00:12Z',
            finishedAt: '2025-01-01T00:00:30Z',
          },
        ],
      },
    };

    const timeline = buildTimeline(run as any);
    expect(timeline.childTimelines).toHaveLength(1);
    expect(timeline.childTimelines[0].run.id).toBe('run_child_1');
    expect(timeline.childTimelines[0].nodes.length).toBeGreaterThan(0);
  });

  it('handles runs with no children', () => {
    const timeline = buildTimeline(baseRun as any);
    expect(timeline.childTimelines).toHaveLength(0);
  });

  it('handles a run that has not started yet', () => {
    const run = {
      ...baseRun,
      status: 'QUEUED' as const,
      startedAt: undefined,
      finishedAt: undefined,
    };

    const timeline = buildTimeline(run as any);
    const states = timeline.nodes.map((n) => n.state);
    expect(states).toContain('created');
    expect(states).not.toContain('executing');
    expect(states).not.toContain('completed');
  });

  it('has null duration for terminal nodes', () => {
    const timeline = buildTimeline(baseRun as any);
    const lastNode = timeline.nodes[timeline.nodes.length - 1];
    expect(lastNode.duration).toBeNull();
  });
});
