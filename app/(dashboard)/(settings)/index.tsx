import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, View, ScrollView, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/shared/confirm-sheet';
import { FavoritesSection } from '@/components/dashboard/favorites-section';
import { ContentContainer } from '@/components/layout';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { CalendarClock, DollarSign, FolderKanban, Bell, KeyRound, LogOut, ChevronRight, Shield, Users, Rocket, FileText, Code, CircleDot } from 'lucide-react-native';
import { usePreferencesStore } from '@/stores/preferences-store';
import { signOut } from '@/services/auth/sign-out';
import { isBiometricAvailable, getBiometricType, getBiometricLabel, authenticate } from '@/services/biometric/biometric-auth';

function MenuRow({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      className="flex-row items-center px-4 py-3.5 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={[disabled ? { opacity: 0.5 } : undefined, isHovered && { opacity: 0.7 }]}
    >
      <View className="mr-3" importantForAccessibility="no">{icon}</View>
      <Text className="flex-1 text-mobile-secondary text-foreground">{label}</Text>
      {disabled && (
        <View className="bg-muted rounded-full px-2 py-0.5 mr-2">
          <Text className="text-xs text-muted-foreground">Coming Soon</Text>
        </View>
      )}
      <ChevronRight size={18} color="#4B5563" importantForAccessibility="no" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signOutSheetRef = useRef<ConfirmSheetRef>(null);

  const biometricLockEnabled = usePreferencesStore((s) => s.biometricLockEnabled);
  const biometricForSensitiveActions = usePreferencesStore((s) => s.biometricForSensitiveActions);
  const setBiometricLockEnabled = usePreferencesStore((s) => s.setBiometricLockEnabled);
  const setBiometricForSensitiveActions = usePreferencesStore((s) => s.setBiometricForSensitiveActions);

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState('Biometric');

  useEffect(() => {
    async function checkBiometrics() {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricTypeLabel(getBiometricLabel(type));
      }
    }
    checkBiometrics();
  }, []);

  const handleToggleBiometricLock = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const result = await authenticate(`Enable ${biometricTypeLabel} lock`);
      if (result.success) {
        setBiometricLockEnabled(true);
      }
    } else {
      setBiometricLockEnabled(false);
    }
  }, [biometricTypeLabel, setBiometricLockEnabled]);

  const { isTablet } = useDeviceLayout();

  const handleSignOut = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    signOutSheetRef.current?.dismiss();
    await signOut(queryClient);
    // Navigation is handled by the auth guard in _layout.tsx
  }, [queryClient]);

  const menuItems = [
    { icon: <CalendarClock size={20} color="#F59E0B" />, label: 'Schedules', onPress: () => router.push('/(dashboard)/(settings)/schedules') },
    { icon: <Users size={20} color="#6B7280" />, label: 'Profiles', onPress: () => router.push('/(dashboard)/(settings)/profiles') },
    { icon: <FolderKanban size={20} color="#3B82F6" />, label: 'Projects', onPress: () => router.push('/(dashboard)/(settings)/projects') },
    { icon: <DollarSign size={20} color="#22C55E" />, label: 'Costs', onPress: () => router.push('/(dashboard)/(settings)/cost-dashboard') },
    { icon: <KeyRound size={20} color="#A78BFA" />, label: 'Environment Variables', onPress: () => router.push('/(dashboard)/(settings)/env-vars') },
    { icon: <Bell size={20} color="#F59E0B" />, label: 'Notifications', onPress: () => router.push('/(dashboard)/(settings)/notifications'), disabled: true as const },
    { icon: <Rocket size={20} color="#3B82F6" />, label: 'Deployments', onPress: () => router.push('/(dashboard)/(settings)/deployments') },
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic">
      <ContentContainer variant="reading">
      <View className="mt-4 tablet:mt-6">
        <FavoritesSection />
      </View>
      {isTablet ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 32, marginTop: 24 }}>
          {menuItems.map((item) => (
            <View key={item.label} style={{ width: '48%' }}>
              <View className="bg-card border-border rounded-md border overflow-hidden">
                <MenuRow {...item} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View className="bg-card border-border mx-4 mt-4 rounded-md border overflow-hidden">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View className="border-border border-t" />}
              <MenuRow {...item} />
            </React.Fragment>
          ))}
        </View>
      )}

      <Text className="text-mobile-tab font-semibold text-muted-foreground px-4 tablet:px-8 mt-6 tablet:mt-8 mb-2 uppercase tracking-wide" accessibilityRole="header">
        About
      </Text>
      <View className="bg-card border-border mx-4 tablet:mx-8 rounded-md border overflow-hidden">
        <MenuRow
          icon={<Code size={20} color="#6B7280" />}
          label="Source Code (Open Source)"
          onPress={() => Linking.openURL('https://github.com/ndrkltsk/trigger-go')}
        />
        <View className="border-border border-t" />
        <MenuRow
          icon={<CircleDot size={20} color="#6B7280" />}
          label="Report Bug & Get Support"
          onPress={() => Linking.openURL('https://github.com/ndrkltsk/trigger-go/issues')}
        />
        <View className="border-border border-t" />
        <MenuRow
          icon={<FileText size={20} color="#6B7280" />}
          label="Privacy Policy"
          onPress={() => Linking.openURL('https://github.com/ndrkltsk/trigger-go/blob/develop/PRIVACY_POLICY.md')}
        />
      </View>

      <Text className="text-mobile-tab font-semibold text-muted-foreground px-4 tablet:px-8 mt-6 tablet:mt-8 mb-2 uppercase tracking-wide" accessibilityRole="header">
        Security
      </Text>
      <View className="bg-card border-border mx-4 tablet:mx-8 rounded-md border overflow-hidden">
        <View className="flex-row items-center px-4 py-3">
          <Shield size={20} color="#a1a1aa" importantForAccessibility="no" />
          <Text className="flex-1 text-mobile-secondary text-foreground ml-3">
            Lock with {biometricTypeLabel}
          </Text>
          <Switch
            value={biometricLockEnabled}
            onValueChange={handleToggleBiometricLock}
            disabled={!biometricAvailable}
            accessibilityLabel={`Lock with ${biometricTypeLabel}`}
          />
        </View>
        {!biometricAvailable && (
          <View className="px-4 pb-3">
            <Text className="text-mobile-caption text-muted-foreground">
              Biometric authentication is not available on this device.
            </Text>
          </View>
        )}
        {biometricLockEnabled && (
          <>
            <View className="border-border border-t" />
            <View className="flex-row items-center px-4 py-3">
              <Text className="flex-1 text-mobile-secondary text-foreground ml-8">
                Require for sensitive actions
              </Text>
              <Switch
                value={biometricForSensitiveActions}
                onValueChange={setBiometricForSensitiveActions}
                accessibilityLabel="Require biometric for sensitive actions"
              />
            </View>
          </>
        )}
      </View>

      <View className="mx-4 tablet:mx-8 mt-8 mb-8">
        <Button
          variant="outline"
          onPress={() => signOutSheetRef.current?.present()}
          className="flex-row items-center gap-2 border-destructive/30"
        >
          <LogOut size={16} color="#EF4444" />
          <Text className="text-sm font-medium text-destructive">Sign Out</Text>
        </Button>
      </View>

      </ContentContainer>

      <ConfirmSheet
        ref={signOutSheetRef}
        title="Sign out?"
        description="You will need to re-enter your Personal Access Token if you want to use this profile again."
        confirmLabel="Sign Out"
        variant="destructive"
        onConfirm={handleSignOut}
      />
    </ScrollView>
  );
}
