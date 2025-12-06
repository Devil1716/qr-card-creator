import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
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
import { ErrorMessages, SuccessMessages, getErrorMessage } from './utils/errors';
import { Colors } from './constants/colors';
import { CARD_DEFAULTS } from './constants/storage';

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

  const viewShotRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load saved cards on startup
  useEffect(() => {
    initializeApp();
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

  const initializeApp = async () => {
    try {
      const cards = await loadSavedCards();
      setSavedCards(cards);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to initialize app:', error);
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
    if (!viewShotRef.current) {
      Alert.alert('Error', 'Unable to capture card image.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Capture the image
      const tempUri = await viewShotRef.current.capture();

      // 2. Save image permanently to App Storage
      const fileName = `card_${Date.now()}.png`;
      const internalUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({
        from: tempUri,
        to: internalUri,
      });

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
            // Don't block if not granted, just skip gallery
            Alert.alert(
              'Saved to App',
              SuccessMessages.SAVED_TO_APP + ' (Note: Gallery save requires permission).',
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
        // If gallery fails, just notify that it's in history
        Alert.alert(
          'Saved to App',
          SuccessMessages.SAVED_TO_APP + ' (Note: Gallery save may require full app or permission).',
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
    if (!viewShotRef.current) {
      Alert.alert('Error', 'Unable to capture card image.');
      return;
    }

    try {
      const uri = await viewShotRef.current.capture();
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
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveQRCardToGallery}
              disabled={isLoading}
              accessibilityLabel="Save QR card"
              accessibilityRole="button"
            >
              <Ionicons 
                name={isLoading ? "hourglass-outline" : "download-outline"} 
                size={24} 
                color={Colors.text} 
              />
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Saving...' : 'Save Card'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareQRCard}
              disabled={isLoading}
              accessibilityLabel="Share QR card"
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={24} color={Colors.text} />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => {
              resetScanner();
              startScanner();
            }}
            disabled={isLoading}
            accessibilityLabel="Scan another QR code"
            accessibilityRole="button"
          >
            <Ionicons name="scan-outline" size={24} color={Colors.primary} />
            <Text style={styles.scanAgainText}>Scan Another Code</Text>
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
    paddingBottom: 10,
  },
  backButtonCard: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    gap: 8,
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
    fontWeight: '600',
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 8,
  },
  scanAgainText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
