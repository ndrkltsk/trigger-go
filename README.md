# TriggerGo

An unofficial mobile companion app for [Trigger.dev](https://trigger.dev) — monitor, trigger, and manage your background jobs from your phone.

Available on the [App Store](#).

## Features

- **Real-time run monitoring** — Live status updates with color-coded statuses and filtering by task, status, tags, and time period
- **Trigger tasks on the go** — Fire any task with custom JSON payloads, reuse previous payloads, set delays and TTL
- **Timeline & debugging** — Trace full execution lifecycles, drill into attempts, retries, and errors
- **Schedule management** — Create and edit CRON schedules with a visual builder, timezone support, and deduplication
- **Cost tracking** — Monitor spending by period (24h/7d/30d) with per-task cost breakdowns
- **Environment variables** — View, add, edit, delete, and import from .env files
- **Deployments** — Monitor deployment status and versions across environments
- **Global search** — Find any run, task, or schedule from a single search bar
- **Multi-environment** — Switch between dev, staging, production, and preview in one tap
- **Multi-profile** — Save multiple Trigger.dev accounts and switch between projects without logging out
- **Secure** — Tokens stored in device keychain, optional Face ID / Touch ID lock, auto-logout on invalid sessions
- **Offline-ready** — Cached data available offline with automatic sync on reconnect

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo 55, React Native 0.83 |
| Navigation | Expo Router (file-based) |
| UI | NativeWind v4 + React Native Reusables |
| State | Zustand v5 |
| Data | TanStack React Query v5 (offline-first) |
| API | openapi-fetch with generated types |
| Storage | expo-secure-store + MMKV |
| Lists | @shopify/flash-list |
| Animations | react-native-reanimated v4 |
| Error Tracking | Sentry |
| Analytics | PostHog |

## Getting Started

### Prerequisites

- Node.js 22+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (macOS) or Android Emulator
- A [Trigger.dev](https://cloud.trigger.dev) account with a Personal Access Token (PAT)

### Setup

```bash
# Clone the repo
git clone https://github.com/AHorihable/TriggerGo.git
cd TriggerGo

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Generate native projects
npx expo prebuild

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Environment Variables

See [`.env.example`](.env.example) for all available configuration options. At minimum you need:

- `IOS_BUNDLE_IDENTIFIER` / `ANDROID_PACKAGE` — App bundle identifiers
- `EXPO_OWNER` / `EAS_PROJECT_ID` — For EAS builds

Sentry and PostHog are optional — the app works without them.

## Project Structure

```
app/              # Expo Router screens and layouts
  (auth)/         # Login and project selection
  (dashboard)/    # Main app tabs (home, tasks, runs, search, settings)
components/       # React components organized by feature
hooks/            # Custom React hooks
lib/              # Utilities, constants, validation
providers/        # Context providers
services/         # API client, auth, notifications, analytics
stores/           # Zustand state stores
```

## Scripts

```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm test               # Run tests
npm run test:coverage  # Run tests with coverage
npm run lint           # Lint with ESLint
npm run format         # Format with Prettier
npm run typecheck      # TypeScript type checking
npm run knip           # Check for unused dependencies/exports
```

## Privacy

See our [Privacy Policy](PRIVACY_POLICY.md).

## Disclaimer

TriggerGo is not affiliated with or endorsed by Trigger.dev. It is an independent third-party client built for the Trigger.dev REST API.

## License

[GPL-3.0](LICENSE)
