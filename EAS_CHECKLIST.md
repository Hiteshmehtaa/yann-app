# EAS CI/CD Implementation Checklist

## ✅ Completed Setup

- [x] Created GitHub Actions workflows
  - [x] `.github/workflows/eas-build.yml` - Automated builds
  - [x] `.github/workflows/eas-update.yml` - OTA updates
  - [x] `.github/workflows/eas-submit.yml` - Store submissions
- [x] Updated `eas.json` with build profiles and channels
- [x] Added EAS scripts to `package.json`
- [x] Updated `.gitignore` for sensitive files
- [x] Created documentation

## 🔲 Required Actions

### 1. GitHub Secrets Configuration (CRITICAL)

- [ ] Generate Expo access token
  ```bash
  # Visit: https://expo.dev/settings/access-tokens
  # Or run: eas whoami
  ```
- [ ] Add `EXPO_TOKEN` to GitHub repository secrets
  - Go to: Repository → Settings → Secrets and variables → Actions
  - Click "New repository secret"
  - Name: `EXPO_TOKEN`
  - Value: Your token

### 2. Test Local Build (Optional but Recommended)

- [ ] Install EAS CLI globally
  ```bash
  npm install -g eas-cli
  ```
- [ ] Login to Expo
  ```bash
  eas login
  ```
- [ ] Run a test build
  ```bash
  npm run build:preview:android
  ```

### 3. Configure Store Submission (When Ready for Production)

#### For Android (Google Play)
- [ ] Create a Google Play Console account
- [ ] Create service account JSON key
- [ ] Place in `android/service-account-key.json` (gitignored)
- [ ] Or add as GitHub secret

#### For iOS (App Store)
- [ ] Update `eas.json` submit section with:
  - Apple ID (email)
  - App Store Connect App ID
  - Apple Team ID
- [ ] Or add as GitHub secrets

### 4. Update App Configuration

- [ ] Review and update version numbers in `app.json`:
  ```json
  {
    "expo": {
      "version": "1.0.0",
      "android": {
        "versionCode": 1
      }
    }
  }
  ```

### 5. Test CI/CD Pipeline

- [ ] Push to a feature branch
- [ ] Create pull request to `develop`
- [ ] Verify preview build triggers
- [ ] Check GitHub Actions tab for build status
- [ ] Merge PR to `develop`
- [ ] Verify preview update publishes

### 6. Production Deployment

- [ ] Merge `develop` to `main`
- [ ] Verify production build triggers
- [ ] Download and test production build
- [ ] Submit to stores (manual workflow trigger)

## 📋 Pre-Flight Checks

Before your first push:

- [ ] Committed all workflow files
  ```bash
  git add .github/
  git commit -m "feat: Add EAS CI/CD workflows"
  ```
- [ ] Committed updated config files
  ```bash
  git add eas.json package.json .gitignore
  git commit -m "chore: Update EAS and build configuration"
  ```
- [ ] Added EXPO_TOKEN to GitHub secrets
- [ ] Reviewed branch protection rules (optional)
- [ ] Tested local build (optional)

## 🚀 Launch Commands

### First Build
```bash
# Push to trigger automatic build
git push origin develop

# Or trigger manual build
# Go to: GitHub → Actions → EAS Build → Run workflow
```

### First Update
```bash
# After a successful build, push code changes
git add .
git commit -m "fix: Your bug fix"
git push origin develop

# Update will auto-publish to preview channel
```

### First Store Submission
```bash
# After successful production build
# Go to: GitHub → Actions → EAS Submit → Run workflow
# Select platform: android/ios
```

## 📊 Monitoring

After setup, monitor your builds at:
- **GitHub Actions**: https://github.com/YOUR_USERNAME/yann-mobile/actions
- **EAS Dashboard**: https://expo.dev/accounts/YOUR_USERNAME/projects/yann-mobile

## 🐛 Troubleshooting

### Build immediately fails
- Check EXPO_TOKEN is set correctly in GitHub secrets
- Verify token has correct permissions
- Check GitHub Actions logs for specific error

### Updates not received
- Ensure app was built with matching channel
- Check app has internet connection
- Verify update was published successfully

### Cannot submit to stores
- Verify store credentials are configured
- Check build is production profile
- Ensure version numbers are correct

## 📚 Documentation Files

- `EAS_CI_CD_SETUP.md` - Comprehensive setup guide
- `EAS_QUICK_REFERENCE.md` - Quick command reference
- `EAS_CHECKLIST.md` - This file

## 🎉 You're Ready!

Once you've completed the required actions above, your EAS CI/CD pipeline will be fully operational. Every push will trigger automated builds or updates based on your branch and workflow configuration.

**Next Step**: Add `EXPO_TOKEN` to GitHub secrets, then push your code!

---

For questions or issues, refer to:
- [EAS Documentation](https://docs.expo.dev/eas/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
