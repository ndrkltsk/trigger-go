import { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import { ProfileManager } from '@/components/profiles/profile-manager';
import { useProfilesStore } from '@/stores/profiles-store';

export default function ProfilesScreen() {
  const loadProfiles = useProfilesStore((s) => s.loadProfiles);
  const navigation = useNavigation();

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleProfileSwitch = useCallback(() => {
    // Reset the entire navigation state to the dashboard home tab
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: '(dashboard)', state: { index: 0, routes: [{ name: '(home)' }] } }],
      })
    );
  }, [navigation]);

  return (
    <View className="flex-1 bg-background">
      <ProfileManager onProfileSwitch={handleProfileSwitch} />
    </View>
  );
}
