import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'More' }} />
      <Stack.Screen
        name="cost-dashboard"
        options={{
          title: 'Costs',
        }}
      />
      <Stack.Screen name="projects" options={{ title: 'Projects' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen
        name="env-vars"
        options={{
          title: 'Environment Variables',
        }}
      />
      <Stack.Screen name="import-env-vars" options={{ title: 'Import Variables' }} />
      <Stack.Screen name="notification-rules" options={{ title: 'Notification Rules' }} />
      <Stack.Screen name="profiles" options={{ title: 'Profiles' }} />
      <Stack.Screen name="project/[projectRef]" options={{ title: 'Project' }} />
      <Stack.Screen
        name="deployments"
        options={{
          title: 'Deployments',
        }}
      />
      <Stack.Screen name="deployment/[deploymentId]" options={{ title: 'Deployment Detail' }} />
      <Stack.Screen
        name="schedules"
        options={{
          title: 'Schedules',
        }}
      />
      <Stack.Screen name="schedule/[scheduleId]" options={{ title: 'Schedule Detail' }} />
    </Stack>
  );
}
