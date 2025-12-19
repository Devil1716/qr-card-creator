import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const PermissionScreen = ({ onRequestPermission }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconInnerContainer}>
          <Ionicons name="camera-outline" size={80} color={Colors.primary} />
        </View>
        <View style={styles.iconGlow} />
      </View>
      <Text style={styles.title}>Camera Permission Required</Text>
      <Text style={styles.text}>
        We need your camera permission to scan QR codes and create digital copies.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRequestPermission}
        activeOpacity={0.85}
        accessibilityLabel="Grant camera permission"
        accessibilityRole="button"
      >
        <View style={styles.buttonContent}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.text} />
          <Text style={styles.buttonText}>Grant Permission</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.background,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: `${Colors.primary}40`,
    position: 'relative',
  },
  iconInnerContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary,
    opacity: 0.1,
    zIndex: -1,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

PermissionScreen.propTypes = {
  onRequestPermission: PropTypes.func.isRequired,
};

export default PermissionScreen;

