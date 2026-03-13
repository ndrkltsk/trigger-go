import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { RunCard } from '@/components/runs/run-card';
import { RunCardSkeletonList } from '@/components/runs/run-card-skeleton';
import { CalendarClock, Inbox } from 'lucide-react-native';
import { formatRelativeTime } from '@/lib/format';
import type { ListRunItem } from '@/services/api/runs';
import type { ScheduleObject } from '@/services/api/schedules';

interface RecentActivityProps {
  runs: ListRunItem[];
  nextSchedule: ScheduleObject | null;
  isLoading: boolean;
}

export function RecentActivity({ runs, nextSchedule, isLoading }: RecentActivityProps) {
  const router = useRouter();

  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between px-4 tablet:px-8 mb-2">
        <Text className="text-base tablet:text-tablet-body font-semibold text-foreground">Recent Activity</Text>
        <Pressable onPress={() => router.push('/(dashboard)/(runs)')}>
          <Text className="text-sm text-muted-foreground">See all runs</Text>
        </Pressable>
      </View>

      {nextSchedule && (
        <View className="flex-row items-center gap-2 px-4 mb-3">
          <CalendarClock size={14} color="#8B95A5" />
          <Text className="text-xs text-muted-foreground">
            Next scheduled: {nextSchedule.task ?? nextSchedule.externalId ?? 'Unknown'}{' '}
            {nextSchedule.nextRun ? formatRelativeTime(nextSchedule.nextRun) : ''}
          </Text>
        </View>
      )}

      {isLoading ? (
        <RunCardSkeletonList count={3} />
      ) : runs.length === 0 ? (
        <View className="items-center py-8">
          <Inbox size={32} color="#8B95A5" />
          <Text className="text-sm text-muted-foreground mt-2">No recent activity</Text>
        </View>
      ) : (
        runs.map((run) => (
          <RunCard
            key={run.id}
            run={run}
            onPress={() => router.push(`/(dashboard)/(runs)/${run.id}`)}
          />
        ))
      )}
    </View>
  );
}
