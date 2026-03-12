import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Accordion } from '@/components/ui/accordion';
import { AttemptItem } from './attempt-item';
import { RunErrorDisplay } from './run-error-display';
import { getStatusConfig } from '@/lib/status-colors';
import {
  CheckCircle,
  Clock,
  XOctagon,
  TimerOff,
  XCircle,
  Loader,
  Pause,
} from 'lucide-react-native';
import type { RetrieveRunResponse, SerializedError, TraceResponse, SpanSummary } from '@/services/api/runs';

interface RunAttemptsTabProps {
  run: RetrieveRunResponse;
  error: SerializedError | null;
  traceData: TraceResponse | null;
}

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  COMPLETED: CheckCircle,
  FAILED: XOctagon,
  CRASHED: XOctagon,
  SYSTEM_FAILURE: XOctagon,
  TIMED_OUT: TimerOff,
  EXPIRED: TimerOff,
  CANCELED: XCircle,
  EXECUTING: Loader,
  QUEUED: Clock,
  PENDING: Clock,
  PENDING_VERSION: Clock,
  REATTEMPTING: Loader,
  FROZEN: Pause,
  DELAYED: Clock,
};

/** Parse attempt number from span message like "Attempt 1", "Attempt 2", etc. */
function parseAttemptNumber(message: string): number | null {
  const match = message.match(/^Attempt\s+(\d+)$/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract attempt spans from the trace tree */
function extractAttemptSpans(traceData: TraceResponse): SpanSummary[] {
  const attempts: SpanSummary[] = [];
  const root = traceData?.trace?.rootSpan;
  if (!root) return attempts;

  // Attempt spans are direct children of the root span with "Attempt N" messages
  for (const child of root.children ?? []) {
    if (!child?.data) continue;
    const num = parseAttemptNumber(child.data.message);
    if (num != null) {
      // Store the parsed attempt number on the data for downstream use
      child.data.attemptNumber = num;
      attempts.push(child);
    }
  }

  attempts.sort((a, b) => (a.data.attemptNumber ?? 0) - (b.data.attemptNumber ?? 0));
  return attempts;
}

export function RunAttemptsTab({ run, error, traceData }: RunAttemptsTabProps) {
  const attemptSpans = useMemo(
    () => (traceData ? extractAttemptSpans(traceData) : []),
    [traceData]
  );

  const config = getStatusConfig(run.status);
  const StatusIcon = STATUS_ICONS[run.status] ?? Clock;
  const hasStarted = !!run.startedAt;

  // No execution happened
  if (!hasStarted) {
    const messages: Record<string, string> = {
      EXPIRED: 'This run expired before it could execute.',
      CANCELED: 'This run was canceled before it could execute.',
    };
    const message = messages[run.status] ?? 'This run has not started executing yet.';

    return (
      <View className="items-center justify-center py-12 px-6">
        <Icon as={StatusIcon} size={32} color={config.color} className="mb-2" />
        <Text variant="muted" className="text-center">{message}</Text>
      </View>
    );
  }

  // Have trace data with multiple attempts
  if (attemptSpans.length > 0) {
    return (
      <View className="px-4 py-3 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">
            Attempts ({attemptSpans.length})
          </Text>
        </View>

        <Accordion type="multiple" defaultValue={[attemptSpans[attemptSpans.length - 1]?.id]}>
          {attemptSpans.map((span, index) => (
            <AttemptItem
              key={span.id}
              span={span}
              attemptNumber={span.data.attemptNumber ?? index + 1}
              isLatest={index === attemptSpans.length - 1}
            />
          ))}
        </Accordion>
      </View>
    );
  }

  // Fallback: no trace data — show single execution block
  return (
    <View className="px-4 py-3 gap-3">
      <Text className="text-sm font-semibold text-foreground">Execution</Text>

      <View
        className="rounded-lg bg-card px-4 py-3"
        style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <Icon as={StatusIcon} size={18} color={config.color} />
          <Text className="text-sm font-semibold text-foreground">{config.label}</Text>
        </View>

        <View className="gap-1">
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted-foreground">Started</Text>
            <Text className="text-xs text-foreground">
              {run.startedAt ? new Date(run.startedAt).toLocaleString() : '--'}
            </Text>
          </View>
          {run.finishedAt && (
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">Finished</Text>
              <Text className="text-xs text-foreground">
                {new Date(run.finishedAt).toLocaleString()}
              </Text>
            </View>
          )}
          {run.durationMs != null && (
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">Duration</Text>
              <Text className="text-xs text-foreground">
                {Math.round(run.durationMs / 1000)}s
              </Text>
            </View>
          )}
        </View>
      </View>

      {error && (
        <View className="gap-1">
          <Text className="text-sm font-semibold text-foreground">Error</Text>
          <RunErrorDisplay error={error} />
        </View>
      )}
    </View>
  );
}
