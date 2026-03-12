# Self-Hosted Runner Setup

macOS machine required for local iOS and Android builds.

## 1. Install dependencies

```bash
# Node.js 20
brew install node@20

# Fastlane (required by EAS local builds)
brew install fastlane

# CocoaPods (required for iOS native modules)
brew install cocoapods

# Java 17 (required for Android/Gradle builds)
brew install openjdk@17
sudo ln -sfn $(brew --prefix openjdk@17)/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# Android SDK (install Android Studio from https://developer.android.com/studio)
# Then set ANDROID_HOME system-wide (required because EAS local builds don't inherit shell env vars)
launchctl setenv ANDROID_HOME $HOME/Library/Android/sdk

# Xcode (install from App Store, then accept license and download iOS platform)
sudo xcodebuild -license accept
xcodebuild -downloadPlatform iOS
```

## 2. Install Apple WWDR certificates

Without these, certificate import fails silently during local builds.

```bash
curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer
sudo security import AppleWWDRCAG3.cer -k /Library/Keychains/System.keychain
rm AppleWWDRCAG3.cer
```

## 3. Configure EAS credentials

Run this from the project directory to store your iOS signing credentials on EAS:

```bash
npx eas-cli credentials
```

It will ask for:
- Apple account login
- Distribution certificate (.p12) — export from Keychain Access or create in Apple Developer portal
- Provisioning profile

These get stored on EAS servers and are pulled automatically during builds.

## 4. Set up GitHub Actions runner

Follow GitHub's guide: **Settings → Actions → Runners → New self-hosted runner**

Run the runner interactively (not as a service):

```bash
./run.sh
```

## 5. Configure GitHub secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `ENV_LOCAL` | Full contents of `.env.local` file |
| `EXPO_TOKEN` | Expo access token (or robot token with correct permissions) |
| `ASC_APP_ID` | App Store Connect app ID (numeric, found in App Store Connect URL) |
| `ASC_API_KEY_P8` | Contents of the App Store Connect API .p8 key file |
| `ASC_API_KEY_ID` | App Store Connect API Key ID |
| `ASC_API_KEY_ISSUER_ID` | App Store Connect API Key Issuer ID |

## 6. Expo robot token permissions

If using a robot token for `EXPO_TOKEN`, make sure it has permissions to:
- Read/write builds
- Read/write credentials
- Manage project versions (needed for `autoIncrement`)
