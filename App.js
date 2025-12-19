import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Alert,
  StatusBar,
  Animated,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';

// Components
import LoadingScreen from './components/LoadingScreen';
import PermissionScreen from './components/PermissionScreen';
import QRScanner from './components/QRScanner';
import QRCard from './components/QRCard';
import HistoryScreen from './components/HistoryScreen';
import HomeScreen from './components/HomeScreen';

// Utils & Constants
import { loadSavedCards, addCardToStorage } from './utils/storage';
import { checkForUpdates } from './utils/updater';
import { ErrorMessages, SuccessMessages, getErrorMessage } from './utils/errors';
import { Colors } from './constants/colors';
import { CARD_DEFAULTS } from './constants/storage';
import logger from './utils/logger';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [userName, setUserName] = useState('');
  const [showQRCard, setShowQRCard] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewReady, setIsViewReady] = useState(false);

  const viewShotRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load saved cards and check for updates
  useEffect(() => {
    initializeApp();
    checkForUpdates();
  }, []);

  // Pulse animation for buttons
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Initialize app storage folder
  const initializeStorageFolder = async () => {
    if (Platform.OS === 'web') return null;

    try {
      const storageFolder = `${FileSystem.documentDirectory}QRCards/`;
      const dirInfo = await FileSystem.getInfoAsync(storageFolder);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(storageFolder, { intermediates: true });
      }
      return storageFolder;
    } catch (error) {
      logger.error('Failed to create storage folder:', error);
      return FileSystem.documentDirectory; // Fallback to document directory
    }
  };

  const initializeApp = async () => {
    try {
      // Initialize storage folder
      await initializeStorageFolder();

      const cards = await loadSavedCards();
      setSavedCards(cards);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      logger.error('Failed to initialize app:', error);
      Alert.alert('Error', ErrorMessages.LOAD_FAILED);
    }
  };

  const handleBarcodeScanned = ({ type, data }) => {
    if (!scanned && data) {
      // Validate QR data length
      if (data.length > CARD_DEFAULTS.MAX_DATA_LENGTH) {
        Alert.alert('Error', 'QR code data is too long. Maximum length is 500 characters.');
        return;
      }

      setScanned(true);
      setScannedData(data);
      setShowScanner(false);
      setShowQRCard(true);
    }
  };

  const saveQRCardToGallery = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Saving to gallery is not supported on the web version yet.');
      return;
    }

    if (!viewShotRef.current) {
      Alert.alert('Error', 'Unable to capture card image. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Wait for view to be fully rendered and laid out
      if (!isViewReady) {
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 1. Capture the image with retry logic
      let tempUri;
      const maxRetries = 3;
      let lastError;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Ensure view is ready
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
          }

          tempUri = await viewShotRef.current.capture();
          if (tempUri) break;
        } catch (captureError) {
          lastError = captureError;
          console.warn(`Capture attempt ${attempt + 1} failed:`, captureError);
          if (attempt === maxRetries - 1) {
            throw new Error(`Failed to capture after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
          }
        }
      }

      if (!tempUri) {
        throw new Error('Failed to capture view snapshot');
      }

      // 2. Save image permanently to App Storage in dedicated folder
      const storageFolder = `${FileSystem.documentDirectory}QRCards/`;

      // Ensure folder exists
      try {
        const dirInfo = await FileSystem.getInfoAsync(storageFolder);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(storageFolder, { intermediates: true });
        }
      } catch (dirError) {
        logger.error('Directory creation error:', dirError);
        // Continue anyway, File API might handle it or fail
      }

      const fileName = `card_${Date.now()}.png`;
      const internalUri = `${storageFolder}${fileName}`;

      // Use FileSystem copyAsync
      try {
        await FileSystem.copyAsync({ from: tempUri, to: internalUri });
      } catch (copyError) {
        logger.error('File copy error:', copyError);
        // Fallback: Retry with delay
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          await FileSystem.copyAsync({ from: tempUri, to: internalUri });
        } catch (fallbackError) {
          logger.error('Fallback copy error:', fallbackError);
          throw new Error('Failed to save file. Please try again.');
        }
      }

      // 3. Save to Local History
      const newCard = {
        id: Date.now(),
        data: scannedData,
        name: userName || CARD_DEFAULTS.ANONYMOUS_NAME,
        timestamp: new Date().toLocaleString(),
        imageUri: internalUri,
      };

      const success = await addCardToStorage(newCard, savedCards);
      if (success) {
        setSavedCards(prev => [...prev, newCard]);
      }

      // 4. Try saving to Gallery (User Convenience)
      try {
        if (!mediaPermission?.granted) {
          const { granted } = await requestMediaPermission();
          if (!granted) {
            // Check if we're in Expo Go
            const isExpoGo = Constants?.executionEnvironment === 'storeClient';
            const permissionMessage = isExpoGo
              ? '\n\nNote: Expo Go has limited media library access on Android. Your card is saved to app history. To test full gallery functionality, create a development build.'
              : '\n\nNote: Gallery save requires permission. Your card is saved to app history.';

            // Don't block if not granted, just skip gallery
            Alert.alert(
              'Saved to App',
              SuccessMessages.SAVED_TO_APP + permissionMessage,
              [
                { text: 'OK' },
                { text: 'Share Image', onPress: () => shareImage(tempUri) },
              ]
            );
            return;
          }
        }

        await MediaLibrary.createAssetAsync(tempUri);
        Alert.alert('✅ Success', SuccessMessages.SAVED_TO_GALLERY);
      } catch (galleryError) {
        // Check if we're in Expo Go
        const isExpoGo = Constants?.executionEnvironment === 'storeClient';
        const expoGoMessage = isExpoGo
          ? '\n\nNote: Expo Go has limited media library access on Android. To test full functionality, create a development build: https://docs.expo.dev/develop/development-builds/create-a-build'
          : '\n\nNote: Gallery save may require additional permissions or a development build.';

        // If gallery fails, just notify that it's in history
        Alert.alert(
          'Saved to App',
          SuccessMessages.SAVED_TO_APP + expoGoMessage,
          [
            { text: 'OK' },
            { text: 'Share Image', onPress: () => shareImage(tempUri) },
          ]
        );
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, ErrorMessages.SAVE_FAILED);
      Alert.alert('Error', errorMessage);
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const shareImage = async (uri) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', ErrorMessages.SHARE_FAILED);
      console.error('Share error:', error);
    }
  };

  const shareQRCard = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Sharing is not supported on the web version yet.');
      return;
    }

    if (!viewShotRef.current) {
      Alert.alert('Error', 'Unable to capture card image.');
      return;
    }

    try {
      // Wait for view to be fully rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture with retry logic
      let uri;
      const maxRetries = 3;
      let lastError;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Ensure view is ready
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
          }

          uri = await viewShotRef.current.capture();
          if (uri) break;
        } catch (captureError) {
          lastError = captureError;
          console.warn(`Share capture attempt ${attempt + 1} failed:`, captureError);
          if (attempt === maxRetries - 1) {
            throw new Error(`Failed to capture after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
          }
        }
      }

      if (!uri) {
        throw new Error('Failed to capture view snapshot');
      }

      await shareImage(uri);
    } catch (error) {
      const errorMessage = getErrorMessage(error, ErrorMessages.SHARE_FAILED);
      Alert.alert('Error', errorMessage);
      console.error('Share error:', error);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScannedData('');
    setUserName('');
    setShowQRCard(false);
    setIsViewReady(false);
  };

  const startScanner = () => {
    setShowScanner(true);
    setScanned(false);
  };

  const handleCardDeleted = async () => {
    const cards = await loadSavedCards();
    setSavedCards(cards);
  };

  // Loading state
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingScreen animatedValue={fadeAnim} />
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <PermissionScreen onRequestPermission={requestPermission} />
      </SafeAreaView>
    );
  }

  // Scanner screen
  if (showScanner) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <QRScanner
          onBarcodeScanned={handleBarcodeScanned}
          onBack={() => setShowScanner(false)}
          scanned={scanned}
        />
      </View>
    );
  }

  // History screen
  if (showHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <HistoryScreen
          cards={savedCards}
          onBack={() => setShowHistory(false)}
          onCardDeleted={handleCardDeleted}
        />
      </SafeAreaView>
    );
  }

  // QR Card screen
  if (showQRCard) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.cardHeader}>
            <TouchableOpacity
              onPress={resetScanner}
              style={styles.backButtonCard}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.cardHeaderTitle}>Your Digital QR Card</Text>
          </View>

          <QRCard
            qrData={scannedData}
            userName={userName}
            onNameChange={setUserName}
            viewShotRef={viewShotRef}
            isLoading={isLoading}
            onLayout={() => setIsViewReady(true)}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveQRCardToGallery}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityLabel="Save QR card"
              accessibilityRole="button"
            >
              <View style={styles.actionButtonContent}>
                <View style={styles.actionButtonIconContainer}>
                  <Ionicons
                    name={isLoading ? "hourglass-outline" : "download-outline"}
                    size={22}
                    color={Colors.text}
                  />
                </View>
                <Text style={styles.actionButtonText}>
                  {isLoading ? 'Saving...' : 'Save Card'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareQRCard}
              disabled={isLoading}
              activeOpacity={0.85}
              accessibilityLabel="Share QR card"
              accessibilityRole="button"
            >
              <View style={styles.actionButtonContent}>
                <View style={styles.actionButtonIconContainer}>
                  <Ionicons name="share-outline" size={22} color={Colors.text} />
                </View>
                <Text style={styles.actionButtonText}>Share</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => {
              resetScanner();
              startScanner();
            }}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityLabel="Scan another QR code"
            accessibilityRole="button"
          >
            <View style={styles.scanAgainButtonContent}>
              <Ionicons name="scan-outline" size={22} color={Colors.primary} />
              <Text style={styles.scanAgainText}>Scan Another Code</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Home Screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <HomeScreen
        onStartScanning={startScanner}
        onViewHistory={() => setShowHistory(true)}
        savedCardsCount={savedCards.length}
        fadeAnim={fadeAnim}
        pulseAnim={pulseAnim}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButtonCard: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 15,
    letterSpacing: -0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionButtonIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.success,
  },
  shareButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scanAgainButton: {
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
    overflow: 'hidden',
  },
  scanAgainButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  scanAgainText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
