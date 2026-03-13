# Privacy Policy

**Last updated:** March 13, 2026

TriggerGo ("the App") is an unofficial, independent mobile client for the Trigger.dev platform. This privacy policy explains how the App handles your data.

## Analytics (PostHog)

We use **PostHog** to understand how the App is used and improve the experience. PostHog collects:

- Screen views and touch interactions
- App lifecycle events (launch, background, foreground)
- Device type, OS version, and app version
- A randomly generated anonymous identifier

Analytics data is sent to PostHog's EU infrastructure (`eu.i.posthog.com`). PostHog does not collect your Trigger.dev tokens or any data from your Trigger.dev account. For more information, see [PostHog's Privacy Policy](https://posthog.com/privacy).

## Error Tracking & Metrics (Sentry)

We use **Sentry** to detect and fix crashes, monitor app health, and track performance. Sentry collects:

- Crash reports and error logs with stack traces
- Device type, OS version, and app version
- IP address (anonymized by Sentry)
- Session replay data for a small percentage of sessions (10%) and for sessions where an error occurs, to help us reproduce and fix bugs
- **Application metrics** — Aggregate counters and timing distributions for API calls, authentication events, real-time connections, notification delivery, and network state changes. These metrics contain no personal data; they track operational counts (e.g. "how many API calls failed") and durations (e.g. "how long did a login take"), along with non-identifying attributes such as environment name or HTTP status code.

Error tracking and metrics data is sent to Sentry's EU infrastructure (`de.sentry.io`). Sentry does not collect your Trigger.dev tokens or any data from your Trigger.dev account. For more information, see [Sentry's Privacy Policy](https://sentry.io/privacy/).

## No First-Party Data Collection

Beyond the third-party services listed above, no personal data is collected, stored, or transmitted to any server we control.

## Data Stored On Your Device

The following data is stored locally on your device and never leaves it:

- **Authentication tokens** — Your Trigger.dev Personal Access Token (PAT) and any derived JWT tokens are stored in the device's secure keychain (iOS Keychain / Android Keystore). These are used solely to authenticate API requests to Trigger.dev.
- **Saved profiles** — Profile names and associated server URLs are stored in secure local storage.
- **App preferences** — Settings such as selected environment, favorites, filter preferences, and theme options are stored locally using on-device storage.
- **Cached data** — API responses (runs, tasks, schedules) are cached locally for offline access and performance. This cache is temporary and can be cleared at any time.

## Third-Party Services

The App communicates directly with the **Trigger.dev API** (`https://api.trigger.dev` or your self-hosted instance) using the credentials you provide. Your data is governed by Trigger.dev's own privacy policy when transmitted to their servers. We encourage you to review [Trigger.dev's Privacy Policy](https://trigger.dev/legal/privacy).

## Push Notifications

If you enable push notifications, the App uses the device's native push notification service (Apple Push Notification Service or Firebase Cloud Messaging) to deliver alerts about run failures. Notification tokens are processed locally and are not sent to any server we control.

## Data Sharing

We do not share, sell, rent, or disclose any of your personal data to third parties. Anonymous analytics and error data are processed by PostHog and Sentry as described above.

## Data Deletion

All data is stored locally on your device. To delete all App data:

1. Sign out from the App (this clears all tokens, caches, and stored profiles), or
2. Uninstall the App from your device.

Analytics and error tracking data held by PostHog and Sentry can be deleted upon request by contacting us.

## Children's Privacy

The App is not directed at children under 13 and does not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted to this page with an updated revision date.

## Contact

If you have questions about this privacy policy, please open an issue on our [GitHub repository](https://github.com/AHorihable/TriggerGo/issues).
