import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const LoadingScreen = ({ animatedValue }) => {
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.loadingCircle, { opacity: animatedValue }]}>
        <View style={styles.loadingInnerCircle}>
          <Ionicons name="qr-code-outline" size={64} color={Colors.primary} />
        </View>
        <View style={styles.loadingGlow} />
      </Animated.View>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${Colors.primary}40`,
    position: 'relative',
  },
  loadingInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    opacity: 0.1,
    zIndex: -1,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 18,
    marginTop: 24,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

LoadingScreen.propTypes = {
  animatedValue: PropTypes.instanceOf(Animated.Value).isRequired,
};

export default LoadingScreen;

