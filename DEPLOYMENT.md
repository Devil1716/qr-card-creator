# Deployment Guide 🚀

This guide will help you deploy the QR Card Creator app to production.

## Prerequisites

1. **Expo Account**: Create an account at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install globally with `npm install -g eas-cli`
3. **Android**: Google Play Developer account (for Play Store)
4. **iOS**: Apple Developer account (for App Store)

## Step 1: Configure EAS

```bash
# Login to Expo
eas login

# Configure EAS for your project
eas build:configure
```

This creates an `eas.json` file with build profiles.

## Step 2: Update App Configuration

Before building, ensure your `app.json` has:

- ✅ Correct `bundleIdentifier` (iOS) and `package` (Android)
- ✅ App icon and splash screen assets
- ✅ Proper version numbers
- ✅ All required permissions

## Step 3: Build for Production

### Android Production Build

```bash
# Build APK
eas build --profile production --platform android

# Or use npm script
npm run build:android
```

**Build Options:**
- `--profile production` - Production build
- `--profile preview` - Internal testing APK
- `--profile development` - Development build with dev client

### iOS Production Build

```bash
# Build for iOS
eas build --profile production --platform ios

# Or use npm script
npm run build:ios
```

**Note**: iOS builds require:
- Apple Developer account ($99/year)
- Proper certificates and provisioning profiles
- App Store Connect setup

## Step 4: Test Your Build

1. Download the build from the EAS dashboard
2. Install on a physical device
3. Test all features:
   - QR code scanning
   - Card creation
   - Saving to gallery
   - Sharing functionality
   - History management

## Step 5: Submit to App Stores

### Google Play Store

1. **Prepare Store Listing:**
   - App name, description, screenshots
   - Privacy policy URL
   - App icon and feature graphic

2. **Create App in Play Console:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Fill in all required information

3. **Submit Build:**
   ```bash
   eas submit --platform android
   ```
   
   Or upload the APK manually in Play Console

### Apple App Store

1. **Prepare App Store Listing:**
   - App name, description, screenshots
   - Privacy policy URL
   - App preview videos (optional)

2. **Create App in App Store Connect:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app
   - Fill in all required information

3. **Submit Build:**
   ```bash
   eas submit --platform ios
   ```

## Step 6: Version Management

### Updating Version Numbers

**For Android:**
- Update `versionCode` in `app.json` (increment by 1)
- Update `version` in `app.json` (e.g., "1.0.1")

**For iOS:**
- Update `buildNumber` in `app.json` (increment by 1)
- Update `version` in `app.json` (e.g., "1.0.1")

### Example Version Update

```json
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

## Environment-Specific Builds

### Development Build

For testing with full native features:

```bash
eas build --profile development --platform android
```

Install the development build, then run:
```bash
npm start
```

### Preview Build

For internal testing:

```bash
eas build --profile preview --platform android
```

## Troubleshooting

### Build Fails

1. Check EAS build logs in the dashboard
2. Verify all dependencies are compatible
3. Ensure app.json is valid JSON
4. Check for missing assets

### Permission Issues

- Verify all permissions are declared in `app.json`
- Check permission descriptions are user-friendly
- Test on physical device (not just emulator)

### App Size Too Large

- Optimize images and assets
- Remove unused dependencies
- Enable ProGuard for Android (automatic with EAS)

## Continuous Deployment

### GitHub Actions

You can set up automated builds using GitHub Actions. See `.github/workflows/` for examples.

### EAS Update

For over-the-air updates (JavaScript only, no native changes):

```bash
eas update --branch production --message "Bug fixes"
```

## Security Checklist

Before deploying to production:

- [ ] Remove all console.log statements (use logger utility)
- [ ] Remove API keys or sensitive data
- [ ] Enable ProGuard/R8 for Android
- [ ] Review all permissions
- [ ] Test on multiple devices
- [ ] Verify error handling
- [ ] Check privacy policy compliance

## Support

For issues or questions:
- Check [Expo Documentation](https://docs.expo.dev)
- Visit [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- Check [Expo Forums](https://forums.expo.dev)

## Next Steps

After successful deployment:

1. Monitor app analytics
2. Collect user feedback
3. Plan feature updates
4. Maintain and update regularly


