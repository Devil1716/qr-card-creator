import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import Svg, { Path, Circle } from 'react-native-svg';
import { CARD_DEFAULTS } from '../constants/storage';
import ThreeDCard from './ThreeDCard';

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
  return (
    <View style={styles.wrapper} onLayout={onLayout}>
      <ThreeDCard>
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
            {/* Header: Logo */}
            <View style={styles.header}>
              <BaghirathiLogo />
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <QRCode
                value={qrData || 'No Data'}
                size={180}
                color="#1f2937" // Dark grey/black
                backgroundColor="transparent"
              />
              <Text style={styles.uniqueIdText}>
                NTbJVM
              </Text>
            </View>

            {/* Name Input (Keeping usability but styling to fit) */}
            <TextInput
              style={styles.nameInput}
              placeholder="YOUR NAME"
              placeholderTextColor="#9ca3af" // Light grey
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
      </ThreeDCard>
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
    backgroundColor: '#ffffff', // White
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
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
    color: '#374151', // Dark grey/slate
    letterSpacing: -0.5,
  },
  logoTagline: {
    fontSize: 10,
    color: '#22c55e', // Green
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
    color: '#6b7280', // Grey
    letterSpacing: 1,
    fontFamily: 'monospace' // Or system default monospace if available
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
    color: '#374151', // Dark slate
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerLine2: {
    fontSize: 18,
    fontWeight: '400',
    color: '#374151', // Dark slate
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
