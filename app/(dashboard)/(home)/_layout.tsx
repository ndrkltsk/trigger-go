import { Stack } from 'expo-router';
import { EnvironmentSwitcher } from '@/components/shared/environment-switcher';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerLeft: () => <EnvironmentSwitcher />,
        }}
      />
    </Stack>
  );
}
