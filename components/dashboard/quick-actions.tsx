import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AlertTriangle, Zap, CalendarClock, Rocket } from 'lucide-react-native';
import { useFiltersStore } from '@/stores/filters-store';

const FAILED_STATUSES = ['FAILED', 'CRASHED', 'SYSTEM_FAILURE', 'TIMED_OUT'];

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Failed Runs',
      icon: AlertTriangle,
      color: '#EF4444',
      onPress: () => {
        useFiltersStore.getState().resetWithStatusFilter(FAILED_STATUSES);
        router.navigate('/(dashboard)/(runs)');
      },
    },
    {
      label: 'Trigger Task',
      icon: Zap,
      color: '#3B82F6',
      onPress: () => router.navigate('/(dashboard)/(tasks)'),
    },
    {
      label: 'Schedules',
      icon: CalendarClock,
      color: '#F59E0B',
      onPress: () => router.push('/(dashboard)/(settings)/schedules'),
    },
    {
      label: 'Deployments',
      icon: Rocket,
      color: '#22C55E',
      onPress: () => router.push('/(dashboard)/(settings)/deployments'),
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          onPress={action.onPress}
          className="flex-row items-center gap-1.5 rounded-full h-8 px-3"
          accessibilityLabel={`Go to ${action.label}`}
        >
          <action.icon size={13} color={action.color} />
          <Text className="text-xs font-medium text-foreground">{action.label}</Text>
        </Button>
      ))}
    </ScrollView>
  );
}
