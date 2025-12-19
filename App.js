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
import * as IntentLauncher from 'expo-intent-launcher';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';

// Components
import LoadingScreen from './components/LoadingScreen';
import PermissionScreen from './components/PermissionScreen';
import QRScanner from './components/QRScanner';
import QRCard from './components/QRCard';
import HistoryScreen from './components/HistoryScreen';
import HomeScreen from './components/HomeScreen';
import UpdateModal from './components/UpdateModal';

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

  // Update State
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const viewShotRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load saved cards and check for updates
  useEffect(() => {
    initializeApp();
    handleCheckForUpdates();
  }, []);

  const handleCheckForUpdates = async () => {
    const update = await checkForUpdates();
    if (update) {
      setUpdateInfo(update);
      setShowUpdateModal(true);
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo?.downloadUrl) return;

    setIsDownloading(true);
    try {
      const downloadDest = FileSystem.cacheDirectory + 'app-update.apk';

      // Clean up any old file first to ensure fresh download
      try {
        await FileSystem.deleteAsync(downloadDest, { idempotent: true });
      } catch (e) {
        // Ignore delete errors
      }

      // Download directly (Progress updates removed due to API deprecation)
      setDownloadProgress(0.5); // Fake indeterminate progress

      const { uri, status } = await FileSystem.downloadAsync(
        updateInfo.downloadUrl,
        downloadDest
      );

      setDownloadProgress(1); // Complete

      if (status !== 200) {
        throw new Error(`Download failed with status ${status}`);
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists || fileInfo.size < 500000) {
        throw new Error(`Downloaded file corrupted (Size: ${fileInfo.size}b)`);
      }

      // Install APK
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/vnd.android.package-archive',
        });
      }
    } catch (e) {
      console.error(e);
      console.error(e);
      Alert.alert('Update Failed', `Error: ${e.message}`);
    } finally {
      setIsDownloading(false);
      setShowUpdateModal(false);
    }
  };

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
      const folder = await initializeStorageFolder();
      console.log('Storage folder initialized:', folder);

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
      // 1. Request Media Library Permissions explicitly if needed
      let mediaStatus = mediaPermission?.status;
      if (mediaStatus !== 'granted') {
        const { status } = await requestMediaPermission();
        mediaStatus = status;
      }

      if (mediaStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your gallery to save the QR card. Please grant permission in settings.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Wait for view to be ready
      if (!isViewReady) {
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 2. Capture Image
      let tempUri;
      try {
        tempUri = await viewShotRef.current.capture();
      } catch (err) {
        // Retry once
        await new Promise(resolve => setTimeout(resolve, 500));
        tempUri = await viewShotRef.current.capture();
      }

      if (!tempUri) throw new Error('Failed to capture image');

      // 3. Save to "R8 Cards" Album (Public Gallery)
      try {
        const asset = await MediaLibrary.createAssetAsync(tempUri);
        const albumName = 'R8 Cards';
        const album = await MediaLibrary.getAlbumAsync(albumName);

        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        }

        Alert.alert('Saved! 📸', `Card saved to your Gallery in "${albumName}" folder.`);
      } catch (galleryError) {
        console.error('Gallery save error:', galleryError);
        Alert.alert('Saved', 'Image saved to detailed history, but gallery save failed.');
      }

      // 4. Background: Save to Internal Storage for History (Best Effort)
      try {
        const storageFolder = `${FileSystem.documentDirectory}QRCards/`;
        const dirInfo = await FileSystem.getInfoAsync(storageFolder);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(storageFolder, { intermediates: true });
        }

        const fileName = `card_${Date.now()}.png`;
        const internalUri = `${storageFolder}${fileName}`;
        await FileSystem.copyAsync({ from: tempUri, to: internalUri });

        const newCard = {
          id: Date.now(),
          data: scannedData,
          name: userName || CARD_DEFAULTS.ANONYMOUS_NAME,
          timestamp: new Date().toLocaleString(),
          fileName: fileName,
          imageUri: internalUri,
        };

        await addCardToStorage(newCard, savedCards);
        setSavedCards(prev => [...prev, newCard]);
      } catch (internalError) {
        logger.error('Internal history save failed:', internalError);
        // Do not alert user, they have the gallery copy
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

      <UpdateModal
        visible={showUpdateModal}
        updateInfo={updateInfo}
        onUpdate={handleUpdate}
        onCancel={() => setShowUpdateModal(false)}
        isDownloading={isDownloading}
        progress={downloadProgress}
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
