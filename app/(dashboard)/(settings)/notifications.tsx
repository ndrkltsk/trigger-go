import React from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { ContentContainer } from '@/components/layout';
import { ChevronRight } from 'lucide-react-native';
import { usePreferencesStore, type NotifyEnvironments } from '@/stores/preferences-store';
import { useEnvironmentsStore } from '@/stores/environments-store';
import { useNotificationRulesStore } from '@/stores/notification-rules-store';
import { ENV_FULL_LABELS } from '@/lib/environment';

function SwitchRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Text className="text-mobile-secondary text-foreground">{label}</Text>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-mobile-tab font-semibold text-muted-foreground px-4 mt-6 mb-2 uppercase tracking-wide">
      {title}
    </Text>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const activeRulesCount = useNotificationRulesStore(
    (s) => s.rules.filter((r) => r.enabled).length
  );
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    notifyOnFailures,
    setNotifyOnFailures,
    notifyOnCompletions,
    setNotifyOnCompletions,
    notifyOnDelays,
    setNotifyOnDelays,
    notifyEnvironments,
    setNotifyEnvironments,
    quietHoursEnabled,
    setQuietHoursEnabled,
    quietHoursStart,
    setQuietHoursStart,
    quietHoursEnd,
    setQuietHoursEnd,
  } = usePreferencesStore();

  const availableEnvironments = useEnvironmentsStore((s) => s.availableEnvironments);

  const updateEnv = (key: keyof NotifyEnvironments, value: boolean) => {
    setNotifyEnvironments({ ...notifyEnvironments, [key]: value });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <ScrollView className="flex-1 bg-background">
        <ContentContainer variant="reading">
        <View className="bg-card border-border mx-4 tablet:mx-8 mt-4 tablet:mt-6 rounded-lg border overflow-hidden">
          <SwitchRow
            label="Enable Notifications"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </View>

        <SectionHeader title="Event Types" />
        <View className="bg-card border-border mx-4 tablet:mx-8 rounded-lg border overflow-hidden">
          <SwitchRow
            label="Failures"
            checked={notifyOnFailures}
            onCheckedChange={setNotifyOnFailures}
          />
          <View className="border-border border-t" />
          <SwitchRow
            label="Completions"
            checked={notifyOnCompletions}
            onCheckedChange={setNotifyOnCompletions}
          />
          <View className="border-border border-t" />
          <SwitchRow
            label="Delays"
            checked={notifyOnDelays}
            onCheckedChange={setNotifyOnDelays}
          />
        </View>

        <SectionHeader title="Environments" />
        <View className="bg-card border-border mx-4 tablet:mx-8 rounded-lg border overflow-hidden">
          {availableEnvironments.map((env, index) => (
            <React.Fragment key={env}>
              {index > 0 && <View className="border-border border-t" />}
              <SwitchRow
                label={ENV_FULL_LABELS[env]}
                checked={notifyEnvironments[env] ?? false}
                onCheckedChange={(v) => updateEnv(env, v)}
              />
            </React.Fragment>
          ))}
        </View>

        <SectionHeader title="Custom Rules" />
        <View className="bg-card border-border mx-4 tablet:mx-8 rounded-lg border overflow-hidden">
          <Pressable
            onPress={() => router.push('/(dashboard)/(settings)/notification-rules')}
            className="flex-row items-center justify-between px-4 py-3 active:opacity-70"
          >
            <Text className="text-mobile-secondary text-foreground">Custom Rules</Text>
            <View className="flex-row items-center gap-2">
              {activeRulesCount > 0 && (
                <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                  <Text className="text-mobile-caption font-semibold text-primary">
                    {activeRulesCount} active
                  </Text>
                </View>
              )}
              <ChevronRight size={16} color="#a1a1aa" />
            </View>
          </Pressable>
        </View>

        <SectionHeader title="Quiet Hours" />
        <View className="bg-card border-border mx-4 tablet:mx-8 rounded-lg border overflow-hidden mb-8">
          <SwitchRow
            label="Enable Quiet Hours"
            checked={quietHoursEnabled}
            onCheckedChange={setQuietHoursEnabled}
          />
          {quietHoursEnabled && (
            <>
              <View className="border-border border-t" />
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-mobile-secondary text-foreground">Start</Text>
                <TextInput
                  value={quietHoursStart}
                  onChangeText={setQuietHoursStart}
                  placeholder="22:00"
                  keyboardType="numbers-and-punctuation"
                  className="text-mobile-secondary text-foreground text-right w-20"
                />
              </View>
              <View className="border-border border-t" />
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-mobile-secondary text-foreground">End</Text>
                <TextInput
                  value={quietHoursEnd}
                  onChangeText={setQuietHoursEnd}
                  placeholder="07:00"
                  keyboardType="numbers-and-punctuation"
                  className="text-mobile-secondary text-foreground text-right w-20"
                />
              </View>
            </>
          )}
        </View>
        </ContentContainer>
      </ScrollView>
    </>
  );
}
