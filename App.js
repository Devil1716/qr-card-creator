import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const STORAGE_KEY = '@qr_cards_storage';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [userName, setUserName] = useState('');
  const [showQRCard, setShowQRCard] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [savedCards, setSavedCards] = useState([]);

  const viewShotRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSavedCards();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSavedCards = async () => {
    try {
      const storedCards = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedCards !== null) {
        setSavedCards(JSON.parse(storedCards));
      }
    } catch (e) {
      console.error('Failed to load cards', e);
    }
  };

  const saveCardToStorage = async (newCard) => {
    try {
      const updatedCards = [...savedCards, newCard];
      setSavedCards(updatedCards);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
    } catch (e) {
      console.error('Failed to save card', e);
    }
  };

  useEffect(() => {
    if (showScanner) {
      // Animate scan line
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showScanner]);

  useEffect(() => {
    // Pulse animation for buttons
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

  const handleBarcodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      setScannedData(data);
      setShowScanner(false);
      setShowQRCard(true);
    }
  };

  const saveQRCardToGallery = async () => {
    try {
      if (!mediaPermission?.granted) {
        const { granted } = await requestMediaPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Please grant media library permission to save images.');
          return;
        }
      }

      const uri = await viewShotRef.current.capture();
      const asset = await MediaLibrary.createAssetAsync(uri);

      // Save to app state
      const newCard = {
        id: Date.now(),
        data: scannedData,
        name: userName || 'Anonymous',
        timestamp: new Date().toLocaleString(),
      };
      // Save locally
      await saveCardToStorage(newCard);

      Alert.alert(
        '✅ Success!',
        'Your QR Card has been saved to your gallery!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save the QR card. Please try again.');
      console.error(error);
    }
  };

  const shareQRCard = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share the QR card. Please try again.');
      console.error(error);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScannedData('');
    setShowQRCard(false);
  };

  const startScanner = () => {
    setShowScanner(true);
    setScanned(false);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingCircle, { opacity: fadeAnim }]}>
            <Ionicons name="qr-code-outline" size={80} color="#667eea" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="camera-outline" size={100} color="#667eea" />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need your camera permission to scan QR codes and create digital copies.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showScanner) {
    return (
      <View style={styles.scannerContainer}>
        <StatusBar barStyle="light-content" />
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.scannerOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowScanner(false)}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.scannerTitle}>Scan QR Code</Text>

            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 250],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>

            <Text style={styles.scannerHint}>
              Position the QR code within the frame
            </Text>
          </View>
        </CameraView>
      </View>
    );
  }

  if (showQRCard) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={resetScanner} style={styles.backButtonCard}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cardHeaderTitle}>Your Digital QR Card</Text>
          </View>

          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.qrCard}>
              <View style={styles.qrCardGradient}>
                <View style={styles.cardTopPattern} />
              </View>

              <View style={styles.qrCardContent}>
                <View style={styles.cardBadge}>
                  <Ionicons name="shield-checkmark" size={16} color="#667eea" />
                  <Text style={styles.cardBadgeText}>VERIFIED</Text>
                </View>

                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={scannedData || 'No Data'}
                    size={180}
                    color="#1a1a2e"
                    backgroundColor="#fff"
                  />
                </View>

                <View style={styles.userInfoContainer}>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Enter Your Name"
                    placeholderTextColor="#888"
                    value={userName}
                    onChangeText={setUserName}
                  />

                  <View style={styles.divider} />

                  <View style={styles.dataContainer}>
                    <Text style={styles.dataLabel}>QR CODE DATA</Text>
                    <Text style={styles.dataValue} numberOfLines={3}>
                      {scannedData}
                    </Text>
                  </View>

                  <View style={styles.timestampContainer}>
                    <Ionicons name="time-outline" size={14} color="#888" />
                    <Text style={styles.timestamp}>
                      Created: {new Date().toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ViewShot>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={saveQRCardToGallery}
            >
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Save to Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareQRCard}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => {
              resetScanner();
              startScanner();
            }}
          >
            <Ionicons name="scan-outline" size={24} color="#667eea" />
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
      <Animated.View style={[styles.homeContainer, { opacity: fadeAnim }]}>
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="qr-code" size={60} color="#fff" />
            </View>
          </View>
          <Text style={styles.appTitle}>QR Card Creator</Text>
          <Text style={styles.appSubtitle}>
            Scan, Personalize & Save Your Digital QR Cards
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="scan" size={24} color="#667eea" />
            </View>
            <Text style={styles.featureText}>Quick QR Scan</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="person" size={24} color="#764ba2" />
            </View>
            <Text style={styles.featureText}>Add Your Name</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="save" size={24} color="#f093fb" />
            </View>
            <Text style={styles.featureText}>Save & Share</Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScanner}
            activeOpacity={0.8}
          >
            <View style={styles.scanButtonInner}>
              <Ionicons name="scan-circle" size={32} color="#fff" />
              <Text style={styles.scanButtonText}>Start Scanning</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {savedCards.length > 0 && (
          <View style={styles.savedCardsSection}>
            <Text style={styles.savedCardsTitle}>
              <Ionicons name="folder-open" size={16} color="#667eea" /> Saved Cards: {savedCards.length}
            </Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionIconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  permissionText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#667eea',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  scannerHint: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 30,
  },
  homeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  appTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  appSubtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  scanButton: {
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'hidden',
  },
  scanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 40,
    paddingVertical: 18,
    gap: 12,
    borderRadius: 30,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  savedCardsSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  savedCardsTitle: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  qrCard: {
    margin: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  qrCardGradient: {
    height: 80,
    backgroundColor: '#667eea',
    position: 'relative',
  },
  cardTopPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  qrCardContent: {
    padding: 25,
    alignItems: 'center',
    marginTop: -40,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
    gap: 5,
  },
  cardBadgeText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: 'bold',
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  userInfoContainer: {
    width: '100%',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  dataContainer: {
    backgroundColor: '#f8f9ff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  dataLabel: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 1,
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
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
    backgroundColor: '#10b981',
  },
  shareButton: {
    backgroundColor: '#667eea',
  },
  actionButtonText: {
    color: '#fff',
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
    borderColor: '#667eea',
    gap: 8,
  },
  scanAgainText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});
