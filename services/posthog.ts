import PostHog from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';
import Constants from 'expo-constants';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let client: PostHog | undefined;

export function getPostHogClient(): PostHog | undefined {
  if (!POSTHOG_API_KEY) return undefined;
  if (!client) {
    client = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      captureAppLifecycleEvents: true,
    });
  }
  return client;
}

export function posthogCapture(event: string, properties?: PostHogEventProperties) {
  getPostHogClient()?.capture(event, properties);
}

export function posthogIdentify(userId: string, properties?: PostHogEventProperties) {
  getPostHogClient()?.identify(userId, properties);
}

export function posthogReset() {
  getPostHogClient()?.reset();
}

export function posthogRegister(properties: PostHogEventProperties) {
  getPostHogClient()?.register({
    ...properties,
    app_version: Constants.expoConfig?.version ?? null,
  });
}
