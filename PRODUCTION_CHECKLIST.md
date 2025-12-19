# Production Deployment Checklist ✅

Use this checklist before deploying to production.

## Pre-Build Checklist

### Configuration
- [ ] App name is correct in `app.json`
- [ ] Bundle identifier/package name is unique and correct
- [ ] Version numbers are updated
- [ ] App icon and splash screen are present and optimized
- [ ] All required permissions are declared with user-friendly descriptions

### Code Quality
- [ ] All `console.log` statements replaced with `logger` utility
- [ ] Error handling is comprehensive
- [ ] ErrorBoundary is properly implemented
- [ ] No hardcoded API keys or sensitive data
- [ ] All features tested on physical devices
- [ ] No TODO comments or debug code

### Dependencies
- [ ] All dependencies are up to date
- [ ] No security vulnerabilities (`npm audit`)
- [ ] `expo-constants` is included for environment detection
- [ ] All required native modules are properly configured

### Assets
- [ ] App icon (1024x1024) is present
- [ ] Adaptive icon (Android) is present
- [ ] Splash screen is present
- [ ] All images are optimized

## Build Configuration

### EAS Configuration
- [ ] `eas.json` is properly configured
- [ ] Build profiles (development, preview, production) are set up
- [ ] Android build type is correct (APK or AAB)
- [ ] iOS bundle identifier matches app.json

### Android Specific
- [ ] `versionCode` is incremented
- [ ] Permissions are updated for Android 13+ (READ_MEDIA_IMAGES)
- [ ] Package name is correct
- [ ] Adaptive icon is configured

### iOS Specific
- [ ] `buildNumber` is incremented
- [ ] Bundle identifier is correct
- [ ] Info.plist permissions are properly described
- [ ] App Store Connect app is created

## Testing

### Functional Testing
- [ ] QR code scanning works correctly
- [ ] Card creation and customization works
- [ ] Save to gallery works (on development build)
- [ ] Share functionality works
- [ ] History screen displays saved cards
- [ ] Card deletion works
- [ ] Error states are handled gracefully
- [ ] Permission requests work correctly

### Device Testing
- [ ] Tested on Android (multiple versions if possible)
- [ ] Tested on iOS (if applicable)
- [ ] Tested on different screen sizes
- [ ] Tested in portrait and landscape (if supported)
- [ ] Tested with poor network conditions

### Edge Cases
- [ ] Very long QR code data
- [ ] Empty QR code data
- [ ] Permission denied scenarios
- [ ] Low storage space
- [ ] App backgrounded during operations

## Security

- [ ] No sensitive data in code
- [ ] No API keys in source code
- [ ] Error messages don't expose sensitive information
- [ ] User data is stored securely (AsyncStorage is acceptable for this app)
- [ ] Permissions are requested only when needed

## Performance

- [ ] App starts quickly
- [ ] No memory leaks
- [ ] Images are optimized
- [ ] Animations are smooth
- [ ] No unnecessary re-renders

## App Store Requirements

### Google Play Store
- [ ] Privacy policy URL is provided
- [ ] App description is complete
- [ ] Screenshots are provided (at least 2)
- [ ] Feature graphic is provided
- [ ] Content rating questionnaire is completed
- [ ] Target audience is defined

### Apple App Store
- [ ] Privacy policy URL is provided
- [ ] App description is complete
- [ ] Screenshots for all required device sizes
- [ ] App preview (optional but recommended)
- [ ] Age rating is set
- [ ] App Store categories are selected

## Post-Deployment

- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Track app analytics
- [ ] Plan for updates based on feedback
- [ ] Document known issues (if any)

## Version Update Process

When updating the app:

1. Update version in `app.json`
2. Increment `versionCode` (Android) or `buildNumber` (iOS)
3. Update CHANGELOG.md (if maintained)
4. Test thoroughly
5. Build and submit
6. Monitor for issues

## Quick Commands Reference

```bash
# Development build
npm run build:dev

# Preview build (internal testing)
npm run build:preview

# Production build
npm run build:android
npm run build:ios

# Submit to stores
npm run submit:android
npm run submit:ios
```

## Notes

- Always test on a development build before production
- Keep backups of previous working versions
- Document any special configuration needed
- Keep dependencies updated regularly


