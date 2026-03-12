import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Pressable, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CostStatCard } from '@/components/shared/cost-stat-card';
import { TaskCostRow } from '@/components/shared/task-cost-row';
import { useCostData, type CostPeriod } from '@/hooks/api/use-cost-data';
import { useEnvironment } from '@/hooks/use-environment';
import { ENV_LABELS, ENV_COLORS } from '@/lib/environment';
import { cn } from '@/lib/utils';

const PERIODS: { value: CostPeriod; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

function PeriodSelector({
  selected,
  onChange,
}: {
  selected: CostPeriod;
  onChange: (period: CostPeriod) => void;
}) {
  return (
    <View className="flex-row gap-2 px-4 mb-4">
      {PERIODS.map((p) => (
        <Pressable
          key={p.value}
          onPress={() => onChange(p.value)}
          className={cn(
            'rounded-lg border px-3 py-1.5',
            selected === p.value
              ? 'bg-secondary border-secondary'
              : 'bg-background border-border'
          )}
        >
          <Text
            className={cn(
              'text-xs font-medium',
              selected === p.value ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {p.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function CostDashboardSkeleton() {
  return (
    <View className="px-4 gap-4">
      <View className="flex-row gap-3">
        <Skeleton className="flex-1 h-24 rounded-lg" />
        <Skeleton className="flex-1 h-24 rounded-lg" />
      </View>
      <Skeleton className="h-6 w-32 rounded-md" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-md" />
      ))}
    </View>
  );
}

export default function CostDashboardScreen() {
  const { currentEnvironment, availableEnvironments, setEnvironment } = useEnvironment();
  const [period, setPeriod] = useState<CostPeriod>('7d');
  const { data, isLoading, isFetching, error, refetch } = useCostData(period);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  return (
    <>
      <Stack.Screen options={{ title: 'Costs' }} />
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="pt-4 pb-8">
          <PeriodSelector selected={period} onChange={setPeriod} />

          {(isLoading || (isFetching && !isManualRefreshing)) && <CostDashboardSkeleton />}

          {error && !isFetching && (
            <View className="px-4 py-8 items-center">
              <Text className="text-sm text-destructive">
                Failed to load cost data
              </Text>
            </View>
          )}

          {data && !isFetching && (
            <>
              <View className="flex-row gap-3 px-4 mb-6">
                <CostStatCard
                  label="Total Cost"
                  costCents={data.totalCostCents}
                  runCount={data.totalRuns}
                />
                <CostStatCard
                  label="Base Cost"
                  costCents={data.totalBaseCostCents}
                />
              </View>

              <Text className="text-base font-semibold text-foreground px-4 mb-3">
                Cost by Task
              </Text>

              {data.byTask.length === 0 ? (
                <View className="px-4 py-8 items-center">
                  <Text className="text-sm text-muted-foreground">
                    No cost data available for this period
                  </Text>
                </View>
              ) : (
                <Card className="mx-4 py-0 overflow-hidden">
                  {data.byTask.map((task, index) => (
                    <TaskCostRow
                      key={task.taskIdentifier}
                      taskIdentifier={task.taskIdentifier}
                      totalCostCents={task.totalCostCents}
                      runCount={task.runCount}
                      rank={index + 1}
                    />
                  ))}
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="circle.fill" tintColor={ENV_COLORS[currentEnvironment]} separateBackground>
          {availableEnvironments.map((env) => (
            <Stack.Toolbar.MenuAction
              key={env}
              isOn={env === currentEnvironment}
              onPress={() => setEnvironment(env)}
            >
              {ENV_LABELS[env]}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
    </>
  );
}
