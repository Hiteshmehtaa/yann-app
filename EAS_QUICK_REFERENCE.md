# EAS CI/CD Quick Reference

## 🚀 Quick Start

### First Time Setup
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Generate access token for GitHub Actions
# Visit: https://expo.dev/settings/access-tokens
# Add token as EXPO_TOKEN in GitHub repo secrets
```

## 📦 Build Commands

### Local Builds
```bash
# Development build (with dev tools)
eas build --profile development --platform android --local

# Preview build (internal testing)
eas build --profile preview --platform android

# Production build (store-ready)
eas build --profile production --platform all
```

### Check Build Status
```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Cancel a running build
eas build:cancel [BUILD_ID]
```

## 🔄 Update Commands (OTA)

### Publish Updates
```bash
# Publish to preview channel
eas update --branch preview --message "Your update message"

# Publish to production channel
eas update --branch production --message "Your update message"
```

### Manage Updates
```bash
# List all updates
eas update:list

# View specific update
eas update:view [UPDATE_ID]

# List channels
eas channel:list

# View channel details
eas channel:view [CHANNEL_NAME]
```

## 📱 Submit Commands

### Submit to Stores
```bash
# Submit latest Android build to Google Play
eas submit --platform android --latest

# Submit specific Android build
eas submit --platform android --id [BUILD_ID]

# Submit to iOS App Store
eas submit --platform ios --latest
```

## 🔧 Configuration Commands

```bash
# View EAS configuration
eas config

# Initialize EAS in project
eas init

# Configure build settings
eas build:configure

# View project credentials
eas credentials

# Update project metadata
eas metadata:push
```

## 🌐 GitHub Actions Workflows

### Automatic Triggers

#### EAS Build
- **Push to `main`**: Production build (all platforms)
- **Push to `develop`**: Preview build (Android)
- **Pull Request**: Preview build (Android)
- **Manual**: Choose platform & profile

#### EAS Update
- **Push to `main`** (code changes): Production update
- **Push to `develop`** (code changes): Preview update
- **Manual**: Choose channel

#### EAS Submit
- **Manual only**: Submit to stores

### Manual Workflow Triggers

```bash
# Trigger from GitHub UI:
# 1. Go to Actions tab
# 2. Select workflow (EAS Build/Update/Submit)
# 3. Click "Run workflow"
# 4. Choose options
```

## 🔑 Environment Variables

### Local Development
Create `.env` file:
```env
EXPO_PUBLIC_API_URL=your-api-url
EXPO_PUBLIC_SOCKET_URL=your-socket-url
```

### GitHub Actions
Add in repository secrets:
- `EXPO_TOKEN` (Required)
- `APPLE_ID` (Optional, for iOS submit)
- `ASC_APP_ID` (Optional, for iOS submit)
- `APPLE_TEAM_ID` (Optional, for iOS submit)

## 📊 Monitoring

### Check Build Status
- **EAS Dashboard**: https://expo.dev
- **GitHub Actions**: Repository → Actions tab
- **CLI**: `eas build:list`

### View Logs
```bash
# View build logs
eas build:view [BUILD_ID]

# View update logs  
eas update:view [UPDATE_ID]
```

## 🐛 Common Issues & Solutions

### "EXPO_TOKEN not found"
```bash
# Generate token at: https://expo.dev/settings/access-tokens
# Add to GitHub secrets as EXPO_TOKEN
```

### Build Fails with Gradle Error
```bash
# Clean Android build
cd android && ./gradlew clean
cd .. && eas build --platform android --clear-cache
```

### Update Not Received by App
```bash
# Check channel configuration
eas channel:view preview

# Verify app is using correct channel
eas build:list
```

### Credentials Issues
```bash
# View credentials
eas credentials

# Reset credentials
eas credentials --platform android/ios
```

## 🎯 Best Practices

### Branch Strategy
- `main` → Production builds/updates
- `develop` → Preview builds/updates  
- `feature/*` → Preview builds (via PR)

### Version Management
```bash
# Update version in app.json before production build
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    },
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

### Testing Flow
1. Create feature branch
2. Push → PR → Automated preview build
3. Test on devices
4. Merge to `develop` → Preview update
5. Final testing
6. Merge to `main` → Production build
7. Submit to stores

## 📚 Useful Links

- [EAS Dashboard](https://expo.dev)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Update Docs](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [GitHub Actions Setup](https://docs.expo.dev/build/building-on-ci/)

## 🆘 Get Help

```bash
# Get help for any command
eas --help
eas build --help
eas update --help
eas submit --help

# Check EAS CLI version
eas --version

# Update EAS CLI
npm install -g eas-cli@latest
```
