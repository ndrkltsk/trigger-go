import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

const TAB_COLORS = {
  home: '#A78BFA',       // purple
  tasks: '#3B82F6',      // blue
  runs: '#22C55E',       // green
  settings: '#6B7280',   // gray
};

export default function DashboardLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <NativeTabs disableTransparentOnScrollEdge>
        <NativeTabs.Trigger name="(home)" options={{ iconColor: TAB_COLORS.home, selectedLabelStyle: { color: TAB_COLORS.home } }}>
          <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} selectedColor={TAB_COLORS.home} />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(tasks)" options={{ iconColor: TAB_COLORS.tasks, selectedLabelStyle: { color: TAB_COLORS.tasks } }}>
          <NativeTabs.Trigger.Icon sf={{ default: "square.stack", selected: "square.stack.fill" }} selectedColor={TAB_COLORS.tasks} />
          <NativeTabs.Trigger.Label>Tasks</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(runs)" options={{ iconColor: TAB_COLORS.runs, selectedLabelStyle: { color: TAB_COLORS.runs } }}>
          <NativeTabs.Trigger.Icon sf={{ default: "play", selected: "play.fill" }} selectedColor={TAB_COLORS.runs} />
          <NativeTabs.Trigger.Label>Runs</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(settings)" options={{ iconColor: TAB_COLORS.settings, selectedIconColor: TAB_COLORS.settings, selectedLabelStyle: { color: TAB_COLORS.settings } }}>
          <NativeTabs.Trigger.Icon sf={{ default: "ellipsis", selected: "ellipsis" }} selectedColor={TAB_COLORS.settings} />
          <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(search)" role="search" />
      </NativeTabs>
    </ThemeProvider>
  );
}
