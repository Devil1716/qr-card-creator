# QR Card Creator 📱

A beautiful Android app that scans QR codes and creates personalized digital copies with your name on them.

## Features ✨

- **QR Code Scanning**: Fast and accurate QR code scanning using your device camera
- **Personalization**: Add your name to the scanned QR code card
- **Digital Card Generation**: Creates a beautiful digital card with your QR code
- **Save to Gallery**: Save your QR cards directly to your device gallery
- **Share Functionality**: Share your QR cards with others via any app
- **Modern UI**: Sleek dark theme with smooth animations

## Screenshots

[Screenshots will be added here]

## Tech Stack 🛠️

- **React Native** with **Expo**
- **expo-camera** - For QR code scanning
- **react-native-qrcode-svg** - For QR code generation
- **react-native-view-shot** - For capturing cards as images
- **expo-media-library** - For saving to device gallery
- **expo-sharing** - For sharing functionality

## Getting Started 🚀

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- An Android device or emulator

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/devil1716/qr-card-creator.git
   cd qr-card-creator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run on Android:
   - Press `a` in the terminal to open in Android emulator
   - Or scan the QR code with Expo Go app on your Android device

### Building for Production 🏗️

#### Prerequisites for Production Builds

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to your Expo account:**
   ```bash
   eas login
   ```

3. **Configure EAS (if not already done):**
   ```bash
   eas build:configure
   ```

#### Development Build

For testing with full native functionality (required for media library on Android):

```bash
eas build --profile development --platform android
```

#### Preview Build (Internal Testing)

Create an APK for internal testing:

```bash
eas build --profile preview --platform android
```

#### Production Build

Create a production-ready build:

```bash
# Android APK
eas build --profile production --platform android

# iOS (requires Apple Developer account)
eas build --profile production --platform ios
```

#### Submit to App Stores

```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

### Automated GitHub Build 🤖

This repository includes a GitHub Actions workflow that automatically builds the Android APK whenever you push code.

1. Go to the **Actions** tab in this repository.
2. Click on the latest **Android Build** workflow run.
3. Scroll down to the **Artifacts** section.
4. Download the `app-release.zip` file, extract it, and install the APK on your device.

## Usage 📖

1. **Launch the app** - You'll see the home screen with a "Start Scanning" button
2. **Grant permissions** - Allow camera access when prompted
3. **Scan a QR code** - Point your camera at any QR code
4. **Personalize** - Enter your name on the generated card
5. **Save or Share** - Save the card to your gallery or share it with others

## Project Structure 📁

```
qr-scanner-app/
├── components/          # Reusable UI components
│   ├── ErrorBoundary.js
│   ├── HistoryScreen.js
│   ├── HomeScreen.js
│   ├── LoadingScreen.js
│   ├── PermissionScreen.js
│   ├── QRCard.js
│   └── QRScanner.js
├── constants/         # App constants
│   ├── colors.js
│   └── storage.js
├── utils/             # Utility functions
│   ├── errors.js
│   └── storage.js
├── assets/            # Images and icons
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
├── App.js             # Main application component
├── index.js           # Entry point
├── app.json           # Expo configuration
├── package.json       # Dependencies
├── README.md          # This file
└── IMPROVEMENTS.md    # Code improvements documentation
```

## Permissions Required 🔐

- **Camera** - To scan QR codes
- **Media Library** - To save QR cards to gallery

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is licensed under the MIT License.

## Author ✍️

Created with ❤️ using React Native and Expo
