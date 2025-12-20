import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { CARD_DEFAULTS } from '../constants/storage';

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
          {/* Main Background Gradient */}
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Holographic Texture */}
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'transparent', 'rgba(0,0,0,0.1)']}
              style={styles.textureOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </LinearGradient>

          <View style={styles.content}>
            {/* Header: Verified Badge */}
            <View style={styles.header}>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                <Text style={styles.badgeText}>SECURE</Text>
              </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrData || 'No Data'}
                  size={CARD_DEFAULTS.QR_SIZE - 40}
                  color="#000"
                  backgroundColor="transparent"
                />
              </View>
              {/* Decorative brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* User Info Section */}
            <View style={styles.userInfo}>
              <Text style={styles.label}>IDENTITY</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="YOUR NAME"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={userName}
                onChangeText={onNameChange}
                maxLength={CARD_DEFAULTS.MAX_NAME_LENGTH}
                editable={!isLoading}
                autoCapitalize="characters"
              />
              <View style={styles.divider} />

              <View style={styles.metaContainer}>
                <Text style={styles.dataLabel}>CREATED</Text>
                <Text style={styles.dataValue}>{new Date().toLocaleDateString()}</Text>
              </View>
            </View>
          </View>

          {/* Footer Logo */}
          <View style={styles.footer}>
            <Text style={styles.brandText}>R8</Text>
          </View>
        </View>
      </ViewShot>
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
    width: 300,
    height: 460,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  gradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  textureOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrSection: {
    position: 'relative',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.primary,
    opacity: 0.3,
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 10 },
  cornerTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 10 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 10 },

  userInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  divider: {
    width: 30,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginVertical: 12,
  },
  metaContainer: {
    alignItems: 'center',
  },
  dataLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  dataValue: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  brandText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 18,
    fontWeight: '900',
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
