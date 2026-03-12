import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { RunStatusBadge } from './run-status-badge';
import { getStatusConfig } from '@/lib/status-colors';
import { formatDateTime, formatDuration, formatCost } from '@/lib/format';
import { LiveDuration } from './live-duration';
import type { RetrieveRunResponse } from '@/services/api/runs';

interface RunDetailHeaderProps {
  run: RetrieveRunResponse;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-1.5">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-xs text-foreground">{value}</Text>
    </View>
  );
}

export function RunDetailHeader({ run }: RunDetailHeaderProps) {
  const config = getStatusConfig(run.status);

  return (
    <View className="px-4 py-4">
      {/* Task identifier title */}
      <Text className="text-lg font-bold text-foreground mb-1">
        {run.taskIdentifier}
      </Text>

      {/* Status badge + Run ID row */}
      <View className="flex-row items-center gap-2 mb-3">
        <RunStatusBadge status={run.status} />
        <Text className="text-xs text-muted-foreground">{run.id}</Text>
      </View>

      {/* Metadata rows */}
      <View className="border-t border-border pt-2">
        <MetadataRow label="Started" value={formatDateTime(run.startedAt)} />
        {run.finishedAt && (
          <MetadataRow label="Finished" value={formatDateTime(run.finishedAt)} />
        )}
        {config.isActive && run.startedAt ? (
          <View className="flex-row items-baseline justify-between py-1.5">
            <Text className="text-xs text-muted-foreground">Duration</Text>
            <LiveDuration startedAt={run.startedAt} className="text-xs text-foreground" />
          </View>
        ) : run.startedAt && run.finishedAt ? (
          <MetadataRow
            label="Duration"
            value={formatDuration(
              new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
            )}
          />
        ) : run.durationMs ? (
          <MetadataRow label="Duration" value={formatDuration(run.durationMs)} />
        ) : null}
        {run.finishedAt && <MetadataRow label="Cost" value={formatCost(run.costInCents)} />}
        {run.version && <MetadataRow label="Version" value={run.version} />}
        {run.isTest && <MetadataRow label="Test Run" value="Yes" />}
      </View>
    </View>
  );
}
