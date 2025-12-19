import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import GlassBackground from './GlassBackground';
import GlassCard from './GlassCard';

const HomeScreen = ({
  onStartScanning,
  onViewHistory,
  savedCardsCount,
  fadeAnim,
  pulseAnim,
}) => {
  return (
    <GlassBackground>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

        {/* Top 40% - Viewing Area / Greetings */}
        <View style={styles.viewingArea}>
          <View style={styles.header}>
            <Text style={styles.appName}>QR Card</Text>
            <Text style={styles.appDesc}>Creator</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{savedCardsCount}</Text>
              <Text style={styles.statLabel}>Cards Saved</Text>
            </View>
          </View>
        </View>

        {/* Bottom 60% - Interaction Area */}
        <View style={styles.interactionArea}>
          <View style={styles.actionsContainer}>

            {/* Primary Action - Huge Glass Button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
              <TouchableOpacity
                onPress={onStartScanning}
                activeOpacity={0.9}
                style={styles.scanButtonWrapper}
              >
                <LinearGradient
                  colors={Colors.gradients.primary}
                  style={styles.scanGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="scan-outline" size={48} color="#FFF" />
                  <Text style={styles.scanText}>Scan New Code</Text>
                  <View style={styles.scanShine} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary Actions - Glass Cards */}
            <View style={styles.grid}>
              <TouchableOpacity onPress={onViewHistory} style={styles.gridItem}>
                <GlassCard style={styles.gridCard} intensity={40}>
                  <View style={styles.gridContent}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <Ionicons name="layers-outline" size={24} color={Colors.success} />
                    </View>
                    <Text style={styles.gridTitle}>History</Text>
                    <Text style={styles.gridDesc}>View {savedCardsCount} cards</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>

              <View style={styles.gridItem}>
                <GlassCard style={styles.gridCard} intensity={25}>
                  <View style={styles.gridContent}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 140, 0, 0.2)' }]}>
                      <Ionicons name="star-outline" size={24} color={Colors.accent} />
                    </View>
                    <Text style={styles.gridTitle}>Favorites</Text>
                    <Text style={styles.gridDesc}>Coming Soon</Text>
                  </View>
                </GlassCard>
              </View>
            </View>

          </View>
        </View>

      </Animated.View>
    </GlassBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // TOP SECTION
  viewingArea: {
    height: '45%',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    marginBottom: 20,
  },
  appName: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.5,
    opacity: 0.9,
  },
  appDesc: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 52,
    marginTop: -5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  statItem: {
    paddingRight: 30,
  },
  statNumber: {
    color: Colors.primaryLight,
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },

  // BOTTOM SECTION
  interactionArea: {
    height: '55%',
    justifyContent: 'flex-end',
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    gap: 20,
    width: '100%',
  },

  // SCAN BUTTON
  scanButtonWrapper: {
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  scanGradient: {
    height: 140,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scanText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  scanShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },

  // GRID
  grid: {
    flexDirection: 'row',
    gap: 15,
  },
  gridItem: {
    flex: 1,
  },
  gridCard: {
    height: 140,
    marginVertical: 0, // override default
  },
  gridContent: {
    height: '100%',
    justifyContent: 'center',
    padding: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridDesc: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});

export default HomeScreen;
