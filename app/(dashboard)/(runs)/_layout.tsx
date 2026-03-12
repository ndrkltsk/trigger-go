import { Stack } from 'expo-router';
import { EnvironmentSwitcher } from '@/components/shared/environment-switcher';

export default function RunsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Runs',
          headerLeft: () => <EnvironmentSwitcher />,
        }}
      />
      <Stack.Screen
        name="[runId]"
        options={{
          title: 'Run Detail',
        }}
      />
    </Stack>
  );
}
