import { useCallback, useState } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { useDashboard } from '@/hooks/api/use-dashboard';
import { useFiltersStore } from '@/stores/filters-store';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const {
    stats,
    recentActivity,
    nextSchedule,
    isLoading,
    isError,
    error,
    refetchAll,
  } = useDashboard();

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleStatPress = useCallback(
    (statuses: string[]) => {
      useFiltersStore.getState().resetWithStatusFilter(statuses);
      router.navigate('/(dashboard)/(runs)');
    },
    [router]
  );

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchAll]);

  if (isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-destructive text-center mb-4">
          {(error as Error)?.message ?? 'Failed to load dashboard'}
        </Text>
        <Button variant="outline" onPress={handleRefresh}>
          <Text className="text-sm font-medium">Try again</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isManualRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Stats Grid */}
      <View className="px-4 pt-4">
        <Text className="text-base font-semibold text-foreground mb-3" accessibilityRole="header">Last 24 hours</Text>
        {isLoading ? (
          <View className="gap-2" accessibilityLabel="Loading dashboard data" accessibilityRole="progressbar">
            <View className="flex-row gap-2">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>
            <View className="flex-row gap-2">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>
          </View>
        ) : (
          <View className="gap-2">
            <View className="flex-row gap-2">
              <StatCard
                label="Running"
                count={stats.running}
                color="#3B82F6"
                icon={Activity}
                onPress={() => handleStatPress(['EXECUTING', 'REATTEMPTING'])}
              />
              <StatCard
                label="Failed"
                count={stats.failed}
                color="#EF4444"
                icon={AlertTriangle}
                onPress={() => handleStatPress(['FAILED', 'CRASHED', 'SYSTEM_FAILURE', 'TIMED_OUT'])}
              />
            </View>
            <View className="flex-row gap-2">
              <StatCard
                label="Completed"
                count={stats.completed}
                color="#22C55E"
                icon={CheckCircle}
                onPress={() => handleStatPress(['COMPLETED'])}
              />
              <StatCard
                label="Queued"
                count={stats.queued}
                color="#8B95A5"
                icon={Clock}
                onPress={() => handleStatPress(['QUEUED', 'PENDING_VERSION', 'DELAYED', 'FROZEN'])}
              />
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View className="mt-4">
        <Text className="text-base font-semibold text-foreground px-4 mb-2" accessibilityRole="header">Quick Actions</Text>
        <QuickActions />
      </View>

      {/* Recent Activity */}
      <RecentActivity
        runs={recentActivity}
        nextSchedule={nextSchedule}
        isLoading={isLoading}
      />

      {/* Bottom padding */}
      <View className="h-8" />
    </ScrollView>
  );
}
