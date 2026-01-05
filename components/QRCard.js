import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Animated, Platform } from 'react-native';
import PropTypes from 'prop-types';
import QRCode from 'react-native-qrcode-svg';
// import ViewShot from 'react-native-view-shot'; // Disabled for Expo Go
const ViewShot = React.forwardRef(({ children, ...props }, ref) => {
  // Mock capture method to prevent App.js crash
  React.useImperativeHandle(ref, () => ({
    capture: async () => {
      console.warn("ViewShot capture disabled in Expo Go debug mode");
      return null;
    }
  }));
  return <View {...props}>{children}</View>;
});
import Svg, { Path, Circle } from 'react-native-svg';
import { DeviceMotion } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_DEFAULTS } from '../constants/storage';

// Mock Baghirathi Logo Component using SVG
const BaghirathiLogo = () => (
  <View style={styles.logoContainer}>
    {/* Colorful Abstract Icon (Rainbow/Curve similar to image) */}
    <Svg width="40" height="40" viewBox="0 0 40 40" style={styles.logoIcon}>
      {/* Blue Curve */}
      <Path d="M10 30 C 10 20, 20 10, 30 10" stroke="#0ea5e9" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Green Curve */}
      <Path d="M10 30 C 10 24, 16 18, 30 14" stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Orange Curve */}
      <Path d="M10 30 C 10 28, 12 26, 20 20" stroke="#f59e0b" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Red Dot/Curve ending */}
      <Circle cx="12" cy="28" r="3" fill="#ef4444" />
    </Svg>
    <View style={styles.logoTextContainer}>
      <Text style={styles.logoTitle}>Baghirathi</Text>
      <Text style={styles.logoTagline}>Transforming Transportation</Text>
    </View>
  </View>
);

const QRCard = ({
  qrData,
  userName,
  onNameChange,
  viewShotRef,
  isLoading = false,
  onLayout,
}) => {
  // 3D Animation Values
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const glareOpacity = useRef(new Animated.Value(0)).current;
  const glarePosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start motion tracking
    DeviceMotion.setUpdateInterval(50);
    const subscription = DeviceMotion.addListener((data) => {
      const { rotation } = data;
      if (rotation) {
        const pitch = Math.max(-0.4, Math.min(0.4, rotation.beta || 0));
        const roll = Math.max(-0.4, Math.min(0.4, rotation.gamma || 0));

        Animated.parallel([
          Animated.spring(rotateX, {
            toValue: pitch * 15,
            useNativeDriver: true,
            friction: 8,
            tension: 40
          }),
          Animated.spring(rotateY, {
            toValue: roll * 15,
            useNativeDriver: true,
            friction: 8,
            tension: 40
          }),
          Animated.spring(glarePosition, {
            toValue: roll * 200,
            useNativeDriver: true,
            friction: 8
          }),
          Animated.timing(glareOpacity, {
            toValue: Math.abs(roll) + Math.abs(pitch) > 0.08 ? 0.35 : 0,
            duration: 200,
            useNativeDriver: true
          })
        ]).start();
      }
    });

    return () => subscription.remove();
  }, []);

  const animatedStyle = {
    transform: [
      { perspective: 1000 },
      { rotateX: rotateX.interpolate({ inputRange: [-15, 15], outputRange: ['15deg', '-15deg'] }) },
      { rotateY: rotateY.interpolate({ inputRange: [-15, 15], outputRange: ['-15deg', '15deg'] }) }
    ]
  };

  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <Animated.View style={animatedStyle}>
        <ViewShot
          ref={viewShotRef}
          options={{
            format: 'png',
            quality: 1,
            result: 'tmpfile',
            snapshotContentContainer: false,
          }}
          collapsable={false}
        >
          <View style={styles.card}>
            {/* Glare Effect */}
            <Animated.View
              style={[
                styles.glare,
                {
                  opacity: glareOpacity,
                  transform: [{ translateX: glarePosition }, { rotate: '25deg' }]
                }
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>

            {/* Header: Logo */}
            <View style={styles.header}>
              <BaghirathiLogo />
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <QRCode
                value={qrData || 'No Data'}
                size={180}
                color="#1f2937"
                backgroundColor="transparent"
              />
              <Text style={styles.uniqueIdText}>
                NTbJVM
              </Text>
            </View>

            {/* Name Input */}
            <TextInput
              style={styles.nameInput}
              placeholder="YOUR NAME"
              placeholderTextColor="#9ca3af"
              value={userName}
              onChangeText={onNameChange}
              maxLength={CARD_DEFAULTS.MAX_NAME_LENGTH}
              editable={!isLoading}
              autoCapitalize="words"
            />

            {/* Footer Text */}
            <View style={styles.footer}>
              <Text style={styles.footerLine1}>RELIABLE | SECURE</Text>
              <Text style={styles.footerLine2}>COMFORTABLE</Text>
            </View>
          </View>
        </ViewShot>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  card: {
    width: 320,
    height: 500,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 12,
    overflow: 'hidden',
  },
  glare: {
    position: 'absolute',
    top: -150,
    bottom: -150,
    width: 120,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 10,
  },
  logoTextContainer: {
    alignItems: 'flex-start',
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
    letterSpacing: -0.5,
  },
  logoTagline: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 0,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uniqueIdText: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1,
    fontFamily: 'monospace'
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 5,
    minWidth: 150,
    marginBottom: 20
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerLine1: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerLine2: {
    fontSize: 18,
    fontWeight: '400',
    color: '#374151',
    letterSpacing: 1.5,
  },
});

QRCard.propTypes = {
  qrData: PropTypes.string.isRequired,
  userName: PropTypes.string,
  onNameChange: PropTypes.func.isRequired,
  viewShotRef: PropTypes.object,
  isLoading: PropTypes.bool,
  onLayout: PropTypes.func,
};

QRCard.defaultProps = {
  userName: '',
  isLoading: false,
};

export default QRCard;
