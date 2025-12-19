import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import PropTypes from 'prop-types';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const QRScanner = ({ onBarcodeScanned, onBack, scanned }) => {
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate scan line
    const animation = Animated.loop(
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
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.bottomOverlay} />
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </View>
        </TouchableOpacity>

        <View style={styles.scanArea}>
          <Text style={styles.title}>Scan QR Code</Text>
          
          <View style={styles.frame}>
            <View style={styles.frameOverlay} />
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
                        outputRange: [0, 280],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

          <View style={styles.hintContainer}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.hint}>
              Position the QR code within the frame
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: Colors.overlay,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: Colors.overlay,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.overlayMedium,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanArea: {
    alignItems: 'center',
    zIndex: 5,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 50,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  frame: {
    width: 300,
    height: 300,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  frameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 24,
    opacity: 0.3,
  },
  corner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: Colors.primary,
    zIndex: 2,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 24,
  },
  scanLine: {
    width: '90%',
    height: 4,
    backgroundColor: Colors.primary,
    alignSelf: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 2,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
    backgroundColor: Colors.overlayMedium,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});

QRScanner.propTypes = {
  onBarcodeScanned: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  scanned: PropTypes.bool.isRequired,
};

export default QRScanner;

