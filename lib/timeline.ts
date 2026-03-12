import type { RetrieveRunResponse, CommonRunObject, TraceResponse, SpanSummary } from '@/services/api/runs';

export interface TimelineNode {
  id: string;
  state: string;
  label: string;
  timestamp: string;
  duration: number | null; // ms to next state
  isActive: boolean;
  isCurrent: boolean;
}

export interface RunTimeline {
  nodes: TimelineNode[];
  childTimelines: { run: CommonRunObject; nodes: TimelineNode[] }[];
}

const ACTIVE_STATUSES = ['EXECUTING', 'REATTEMPTING', 'FROZEN'];
const FAILED_STATUSES = ['FAILED', 'CRASHED', 'SYSTEM_FAILURE', 'TIMED_OUT'];

function diffMs(a: string | undefined, b: string | undefined): number | null {
  if (!a || !b) return null;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return diff >= 0 ? diff : null;
}

function buildNodesForRun(run: CommonRunObject): TimelineNode[] {
  const nodes: TimelineNode[] = [];
  const isRunActive = ACTIVE_STATUSES.includes(run.status);
  const isFailed = FAILED_STATUSES.includes(run.status);

  // Node 1: Created
  nodes.push({
    id: `${run.id}-created`,
    state: 'created',
    label: 'Created',
    timestamp: run.createdAt,
    duration: diffMs(run.createdAt, run.startedAt ?? run.finishedAt),
    isActive: false,
    isCurrent: false,
  });

  // Node 2: Delayed (if applicable)
  if (run.delayedUntil) {
    nodes.push({
      id: `${run.id}-delayed`,
      state: 'delayed',
      label: 'Delayed',
      timestamp: run.delayedUntil,
      duration: diffMs(run.delayedUntil, run.startedAt),
      isActive: false,
      isCurrent: run.status === 'DELAYED',
    });
  }

  // Node 3: Queued (between created and started, when not delayed)
  if (!run.delayedUntil && run.startedAt && run.createdAt !== run.startedAt) {
    const queueDuration = diffMs(run.createdAt, run.startedAt);
    if (queueDuration && queueDuration > 100) {
      nodes.push({
        id: `${run.id}-queued`,
        state: 'queued',
        label: 'Queued',
        timestamp: run.createdAt,
        duration: queueDuration,
        isActive: false,
        isCurrent: run.status === 'QUEUED' || run.status === 'PENDING_VERSION',
      });
    }
  }

  // Node 4: Started / Executing
  if (run.startedAt) {
    nodes.push({
      id: `${run.id}-started`,
      state: 'executing',
      label: 'Started',
      timestamp: run.startedAt,
      duration: diffMs(run.startedAt, run.finishedAt),
      isActive: isRunActive,
      isCurrent: isRunActive,
    });
  }

  // Node 5: Finished
  if (run.finishedAt) {
    const statusStr = run.status as string;
    const terminalState = isFailed ? 'failed' : statusStr === 'CANCELED' ? 'canceled' : statusStr === 'EXPIRED' ? 'expired' : 'completed';
    const terminalLabel = isFailed ? 'Failed' : statusStr === 'CANCELED' ? 'Canceled' : statusStr === 'EXPIRED' ? 'Expired' : 'Completed';

    nodes.push({
      id: `${run.id}-finished`,
      state: terminalState,
      label: terminalLabel,
      timestamp: run.finishedAt,
      duration: null,
      isActive: false,
      isCurrent: true,
    });
  }

  return nodes;
}

/** Parse attempt number from span message like "Attempt 1", "Attempt 2", etc. */
function parseAttemptNumber(message: string): number | null {
  const match = message.match(/^Attempt\s+(\d+)$/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract attempt spans from trace tree and build timeline nodes for them */
function buildAttemptNodes(traceData: TraceResponse, runId: string): TimelineNode[] {
  const attemptSpans: SpanSummary[] = [];
  const root = traceData?.trace?.rootSpan;
  if (!root) return [];

  for (const child of root.children ?? []) {
    if (!child?.data) continue;
    const num = parseAttemptNumber(child.data.message);
    if (num != null) {
      child.data.attemptNumber = num;
      attemptSpans.push(child);
    }
  }

  attemptSpans.sort((a, b) => (a.data.attemptNumber ?? 0) - (b.data.attemptNumber ?? 0));

  if (attemptSpans.length <= 1) return [];

  const nodes: TimelineNode[] = [];

  for (let i = 0; i < attemptSpans.length; i++) {
    const span = attemptSpans[i];
    const num = span.data.attemptNumber ?? i + 1;
    const isFailed = span.data.isError;
    const isRunning = span.data.isPartial;
    const durationMs = span.data.duration / 1_000_000;
    const endTimeMs = new Date(span.data.startTime).getTime() + durationMs;

    nodes.push({
      id: `${runId}-attempt-${num}`,
      state: isFailed ? 'attempt-failed' : isRunning ? 'executing' : 'attempt-completed',
      label: `Attempt #${num}` + (isFailed ? ' (Failed)' : isRunning ? ' (Running)' : ' (Completed)'),
      timestamp: span.data.startTime,
      duration: durationMs > 0 ? durationMs : null,
      isActive: isRunning,
      isCurrent: false,
    });

    // Add retry delay node between failed attempts
    if (isFailed && i < attemptSpans.length - 1) {
      const nextSpan = attemptSpans[i + 1];
      const delayMs = new Date(nextSpan.data.startTime).getTime() - endTimeMs;
      if (delayMs > 0) {
        nodes.push({
          id: `${runId}-retry-delay-${num}`,
          state: 'retry-delay',
          label: 'Retry Delay',
          timestamp: new Date(endTimeMs).toISOString(),
          duration: delayMs,
          isActive: false,
          isCurrent: false,
        });
      }
    }
  }

  return nodes;
}

export function buildTimeline(run: RetrieveRunResponse, traceData?: TraceResponse | null): RunTimeline {
  const baseNodes = buildNodesForRun(run);

  // Insert attempt nodes from trace data between "Started" and the terminal node
  let nodes: TimelineNode[];
  if (traceData) {
    const attemptNodes = buildAttemptNodes(traceData, run.id);
    if (attemptNodes.length > 0) {
      // Find the "Started" node index
      const startedIdx = baseNodes.findIndex((n) => n.state === 'executing');
      // Find the terminal node index
      const terminalIdx = baseNodes.findIndex((n) =>
        ['completed', 'failed', 'canceled', 'expired'].includes(n.state)
      );

      if (startedIdx >= 0 && terminalIdx > startedIdx) {
        nodes = [
          ...baseNodes.slice(0, startedIdx + 1),
          ...attemptNodes,
          ...baseNodes.slice(terminalIdx),
        ];
      } else if (startedIdx >= 0) {
        // No terminal node yet (in progress)
        nodes = [
          ...baseNodes.slice(0, startedIdx + 1),
          ...attemptNodes,
          ...baseNodes.slice(startedIdx + 1),
        ];
      } else {
        nodes = baseNodes;
      }
    } else {
      nodes = baseNodes;
    }
  } else {
    nodes = baseNodes;
  }

  const childTimelines: RunTimeline['childTimelines'] = [];
  if (run.relatedRuns?.children) {
    for (const child of run.relatedRuns.children) {
      childTimelines.push({
        run: child,
        nodes: buildNodesForRun(child),
      });
    }
  }

  return { nodes, childTimelines };
}
