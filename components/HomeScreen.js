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
            <View style={styles.logoInnerCircle}>
              <Ionicons name="qr-code" size={64} color={Colors.text} />
            </View>
            <View style={styles.logoGlow} />
          </View>
        </View>
        <Text style={styles.title}>QR Card Creator</Text>
        <Text style={styles.subtitle}>
          Scan, Personalize & Save Your Digital QR Cards
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: `${Colors.primary}20` }]}>
            <Ionicons name="scan" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.featureText}>Quick Scan</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: `${Colors.secondary}20` }]}>
            <Ionicons name="person" size={28} color={Colors.secondary} />
          </View>
          <Text style={styles.featureText}>Personalize</Text>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: `${Colors.accent}20` }]}>
            <Ionicons name="share-social" size={28} color={Colors.accent} />
          </View>
          <Text style={styles.featureText}>Share</Text>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={onStartScanning}
          activeOpacity={0.85}
          accessibilityLabel="Start scanning QR code"
          accessibilityRole="button"
        >
          <View style={styles.scanButtonInner}>
            <View style={styles.scanButtonIconContainer}>
              <Ionicons name="scan-circle" size={36} color={Colors.text} />
            </View>
            <Text style={styles.scanButtonText}>Start Scanning</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.text} style={styles.arrowIcon} />
          </View>
          <View style={styles.scanButtonGlow} />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity 
        style={styles.savedCardsSection} 
        onPress={onViewHistory}
        activeOpacity={0.7}
        accessibilityLabel={savedCardsCount > 0 ? `View ${savedCardsCount} saved cards` : 'View saved cards history'}
        accessibilityRole="button"
      >
        <View style={styles.savedCardsContent}>
          <View style={styles.savedCardsIconContainer}>
            <Ionicons name="folder-open" size={20} color={Colors.primary} />
          </View>
          <View style={styles.savedCardsTextContainer}>
            <Text style={styles.savedCardsTitle}>View Saved Cards</Text>
            <Text style={styles.savedCardsCount}>
              {savedCardsCount > 0 
                ? `${savedCardsCount} ${savedCardsCount === 1 ? 'card' : 'cards'} saved`
                : 'No cards saved yet'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
    position: 'relative',
  },
  logoInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    opacity: 0.2,
    zIndex: -1,
  },
  title: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 17,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 50,
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  scanButton: {
    alignSelf: 'center',
    borderRadius: 30,
    overflow: 'visible',
    position: 'relative',
    width: '100%',
    maxWidth: 320,
  },
  scanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 20,
    gap: 12,
    borderRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  scanButtonIconContainer: {
    marginRight: 4,
  },
  scanButtonText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  scanButtonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    opacity: 0.1,
    zIndex: -1,
  },
  savedCardsSection: {
    marginTop: 32,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedCardsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedCardsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedCardsTextContainer: {
    flex: 1,
  },
  savedCardsTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  savedCardsCount: {
    color: Colors.textSecondary,
    fontSize: 13,
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

