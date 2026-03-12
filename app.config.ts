import { ExpoConfig, ConfigContext } from 'expo/config';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME ?? config.name!,
  slug: process.env.EXPO_PUBLIC_APP_SLUG ?? config.slug!,
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? config.scheme,
  ios: {
    ...config.ios,
    bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER ?? 'com.example.triggergo',
    ...(process.env.APPLE_TEAM_ID ? { appleTeamId: process.env.APPLE_TEAM_ID } : {}),
  },
  android: {
    ...config.android,
    package: process.env.ANDROID_PACKAGE ?? 'com.example.triggergo',
  },
  extra: {
    router: {},
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  owner: process.env.EXPO_OWNER,
});
