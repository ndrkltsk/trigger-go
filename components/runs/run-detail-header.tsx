import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { RunStatusBadge } from './run-status-badge';
import { getStatusConfig } from '@/lib/status-colors';
import { formatDateTime, formatDuration, formatCost } from '@/lib/format';
import { LiveDuration } from './live-duration';
import { useDeviceLayout } from '@/hooks/use-device-layout';
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
  const { isTablet } = useDeviceLayout();

  const metadataItems: { label: string; value?: string; custom?: React.ReactNode }[] = [
    { label: 'Started', value: formatDateTime(run.startedAt) },
  ];
  if (run.finishedAt) {
    metadataItems.push({ label: 'Finished', value: formatDateTime(run.finishedAt) });
  }
  if (config.isActive && run.startedAt) {
    metadataItems.push({
      label: 'Duration',
      custom: <LiveDuration startedAt={run.startedAt} className="text-xs text-foreground" />,
    });
  } else if (run.startedAt && run.finishedAt) {
    metadataItems.push({
      label: 'Duration',
      value: formatDuration(new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()),
    });
  } else if (run.durationMs) {
    metadataItems.push({ label: 'Duration', value: formatDuration(run.durationMs) });
  }
  if (run.finishedAt) {
    metadataItems.push({ label: 'Cost', value: formatCost(run.costInCents) });
  }
  if (run.version) {
    metadataItems.push({ label: 'Version', value: run.version });
  }
  if (run.isTest) {
    metadataItems.push({ label: 'Test Run', value: 'Yes' });
  }

  return (
    <View className="px-4 tablet:px-8 py-4">
      {/* Task identifier title */}
      <Text className="text-lg tablet:text-tablet-title font-bold text-foreground mb-1">
        {run.taskIdentifier}
      </Text>

      {/* Status badge + Run ID row */}
      <View className="flex-row items-center gap-2 mb-3">
        <RunStatusBadge status={run.status} />
        <Text selectable className="text-xs text-muted-foreground">{run.id}</Text>
      </View>

      {/* Metadata rows — 2-column on tablet */}
      <View
        className="border-t border-border pt-2"
        style={isTablet ? { flexDirection: 'row', flexWrap: 'wrap' } : undefined}
      >
        {metadataItems.map((item) => (
          <View
            key={item.label}
            className="flex-row items-baseline justify-between py-1.5"
            style={isTablet ? { width: '50%', paddingRight: 12 } : undefined}
          >
            <Text className="text-xs text-muted-foreground">{item.label}</Text>
            {item.custom ?? <Text className="text-xs text-foreground">{item.value}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}
