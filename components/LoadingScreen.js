import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native';
import { Colors } from '../constants/colors';

const LoadingScreen = ({ animatedValue }) => {
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.loadingCircle, { opacity: animatedValue }]}>
        <Ionicons name="qr-code-outline" size={80} color={Colors.primary} />
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
  },
  loadingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${Colors.primary}1A`, // 10% opacity
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${Colors.primary}4D`, // 30% opacity
  },
  loadingText: {
    color: Colors.text,
    fontSize: 18,
    marginTop: 20,
    fontWeight: '500',
  },
});

export default LoadingScreen;

