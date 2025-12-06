import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const PermissionScreen = ({ onRequestPermission }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="camera-outline" size={100} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Camera Permission Required</Text>
      <Text style={styles.text}>
        We need your camera permission to scan QR codes and create digital copies.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRequestPermission}
        accessibilityLabel="Grant camera permission"
        accessibilityRole="button"
      >
        <Ionicons name="checkmark-circle" size={24} color={Colors.text} />
        <Text style={styles.buttonText}>Grant Permission</Text>
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
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: `${Colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: `${Colors.primary}4D`,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    gap: 10,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});

PermissionScreen.propTypes = {
  onRequestPermission: PropTypes.func.isRequired,
};

export default PermissionScreen;

