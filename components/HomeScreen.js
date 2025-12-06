import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const HomeScreen = ({ 
  onStartScanning, 
  onViewHistory, 
  savedCardsCount,
  fadeAnim,
  pulseAnim,
}) => {
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="qr-code" size={60} color={Colors.text} />
          </View>
        </View>
        <Text style={styles.title}>QR Card Creator</Text>
        <Text style={styles.subtitle}>
          Scan, Personalize & Save Your Digital QR Cards
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="scan" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>Quick QR Scan</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="person" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.featureText}>Add Your Name</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="save" size={24} color={Colors.accent} />
          </View>
          <Text style={styles.featureText}>Save & Share</Text>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={onStartScanning}
          activeOpacity={0.8}
          accessibilityLabel="Start scanning QR code"
          accessibilityRole="button"
        >
          <View style={styles.scanButtonInner}>
            <Ionicons name="scan-circle" size={32} color={Colors.text} />
            <Text style={styles.scanButtonText}>Start Scanning</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {savedCardsCount > 0 && (
        <TouchableOpacity 
          style={styles.savedCardsSection} 
          onPress={onViewHistory}
          accessibilityLabel={`View ${savedCardsCount} saved cards`}
          accessibilityRole="button"
        >
          <Text style={styles.savedCardsTitle}>
            <Ionicons name="folder-open" size={16} color={Colors.primary} /> 
            {' '}Saved Cards: {savedCardsCount} (Tap to View)
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 18,
    gap: 12,
    borderRadius: 30,
  },
  scanButtonText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  savedCardsSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  savedCardsTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

HomeScreen.propTypes = {
  onStartScanning: PropTypes.func.isRequired,
  onViewHistory: PropTypes.func.isRequired,
  savedCardsCount: PropTypes.number.isRequired,
  fadeAnim: PropTypes.instanceOf(Animated.Value).isRequired,
  pulseAnim: PropTypes.instanceOf(Animated.Value).isRequired,
};

export default HomeScreen;

