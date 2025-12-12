# EAS CI/CD Setup Guide

This document explains how to set up and use the EAS CI/CD pipeline for the Yann Mobile app.

## Overview

The CI/CD setup includes three workflows:

1. **EAS Build** - Builds the app for Android/iOS
2. **EAS Update** - Publishes OTA updates without rebuilding
3. **EAS Submit** - Submits builds to app stores

## Prerequisites

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure Your Project

The project is already configured with EAS Project ID: `8abeb1ba-a4c4-4269-aca9-39974e9e40f4`

## GitHub Secrets Setup

### Required Secret

Add the following secret to your GitHub repository (Settings → Secrets and variables → Actions):

#### EXPO_TOKEN

1. Generate a token:
   ```bash
   eas whoami
   # Note your username, then:
   eas build:configure
   ```

2. Or create a token at: https://expo.dev/accounts/[your-username]/settings/access-tokens

3. Add the token as `EXPO_TOKEN` in your GitHub repository secrets

### Optional Secrets (for store submission)

For **Android (Google Play)**:
- Place your `service-account-key.json` in the `android/` directory (gitignored)
- Or store it as a GitHub secret and modify the workflow to write it to a file

For **iOS (App Store)**:
- `APPLE_ID` - Your Apple ID email
- `ASC_APP_ID` - App Store Connect App ID
- `APPLE_TEAM_ID` - Your Apple Developer Team ID
- Update these values in `eas.json` submit section

## Build Profiles

### Development
- **Purpose**: Local development with development client
- **Distribution**: Internal
- **Platform**: Android & iOS
- **Output**: Debug build with hot reload support

### Preview
- **Purpose**: Testing and QA
- **Distribution**: Internal
- **Platform**: APK (Android), IPA (iOS)
- **Output**: Installable preview build
- **Channel**: `preview` (receives OTA updates from preview branch)

### Production
- **Purpose**: Production releases
- **Distribution**: Store
- **Platform**: AAB (Android), IPA (iOS)
- **Output**: Store-ready build
- **Channel**: `production` (receives OTA updates from production branch)

## Automated Workflows

### EAS Build Workflow

**Triggers:**
- Push to `main` → Production build (all platforms)
- Push to `develop` → Preview build (Android only)
- Pull requests → Preview build (Android only)
- Manual trigger → Choose platform and profile

**What it does:**
1. Sets up Node.js and EAS CLI
2. Installs dependencies
3. Triggers EAS build based on branch/trigger
4. Posts build link to PR (if applicable)

### EAS Update Workflow

**Triggers:**
- Push to `main` → Update production channel
- Push to `develop` → Update preview channel
- Manual trigger → Choose channel
- Only when code in `src/`, `App.tsx`, `index.ts`, or `package.json` changes

**What it does:**
1. Publishes OTA update to specified channel
2. Users with matching channel builds receive update automatically
3. No app store submission needed

### EAS Submit Workflow

**Triggers:**
- Manual trigger only

**What it does:**
1. Submits latest production build to Google Play or App Store
2. Choose platform (Android/iOS)

## Usage Examples

### Building Locally

```bash
# Development build
eas build --profile development --platform android

# Preview build
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all
```

### Publishing Updates

```bash
# Update preview channel
eas update --branch preview --message "Bug fixes"

# Update production channel
eas update --branch production --message "New features"
```

### Submitting to Stores

```bash
# Submit to Google Play
eas submit --platform android --latest

# Submit to App Store
eas submit --platform ios --latest
```

## Branch Strategy

- **main** → Production builds and updates
- **develop** → Preview builds and updates
- **feature/** → Preview builds (on PR)

## Update Channels

Updates are automatically delivered to users based on their build channel:

- Apps built with `preview` profile receive updates from `preview` branch
- Apps built with `production` profile receive updates from `production` branch

## Build Status

Check build status at:
- EAS Dashboard: https://expo.dev/accounts/[your-username]/projects/yann-mobile/builds
- GitHub Actions: Repository → Actions tab

## Common Commands

```bash
# Check EAS configuration
eas config

# View build history
eas build:list

# View update history
eas update:list

# Configure EAS for first time
eas build:configure

# Link project to EAS
eas init

# View channels
eas channel:list

# View current updates
eas update:view
```

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs for specific error
2. Ensure EXPO_TOKEN is properly set
3. Verify eas.json configuration
4. Check Android/iOS specific build settings

### Updates Not Working

1. Ensure build has matching channel
2. Check update was published successfully
3. Verify app is connected to internet
4. Check EAS Update configuration in app.json

### Submit Fails

1. Verify store credentials are correct
2. Ensure build is production profile
3. Check app version and build number
4. Review store-specific requirements

## Next Steps

1. ✅ Configure GitHub secrets (EXPO_TOKEN)
2. ✅ Push code to trigger first build
3. ✅ Test preview build
4. ✅ Configure store credentials for submission
5. ✅ Submit first production build

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [GitHub Actions for EAS](https://docs.expo.dev/build/building-on-ci/)
