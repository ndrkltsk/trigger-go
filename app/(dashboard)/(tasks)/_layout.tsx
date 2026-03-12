import { Stack } from 'expo-router';
import { EnvironmentSwitcher } from '@/components/shared/environment-switcher';

export default function TasksLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Tasks',
          headerLeft: () => <EnvironmentSwitcher />,
        }}
      />
      <Stack.Screen
        name="[taskId]"
        options={{
          title: 'Task Detail',
        }}
      />
    </Stack>
  );
}
