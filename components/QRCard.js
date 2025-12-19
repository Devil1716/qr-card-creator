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
          {/* Main Background Gradient (Blue -> Green) */}
          <LinearGradient
            colors={[Colors.primary, '#009966', Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Holographic/Texture Overlay */}
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'transparent', 'rgba(255,255,255,0.05)']}
              style={styles.textureOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
            />

            {/* R8 Watermark */}
            <View style={styles.watermarkContainer}>
              <Text style={styles.watermarkText}>R8</Text>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.badge}>
                <View style={styles.badgeIconContainer}>
                  <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                </View>
                <Text style={styles.badgeText}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrInnerContainer}>
                <QRCode
                  value={qrData || 'No Data'}
                  size={CARD_DEFAULTS.QR_SIZE}
                  logoBackgroundColor='transparent'
                  color={Colors.backgroundSecondary}
                  backgroundColor={Colors.cardBackground}
                />
                {/* R8 Tiny Logo Center (Simulated with Text if no image, or just keep pure QR) 
                     Actually standard QR is cleaner. 
                 */}
              </View>
              {/* Glow effect behind QR */}
              <View style={styles.qrGlow} />
            </View>

            <Text style={styles.scanMeText}>SCAN ME</Text>

            <View style={styles.userInfo}>
              <View style={styles.nameInputContainer}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="ENTER NAME"
                  placeholderTextColor={'rgba(255,255,255,0.6)'}
                  value={userName}
                  onChangeText={onNameChange}
                  maxLength={CARD_DEFAULTS.MAX_NAME_LENGTH}
                  editable={!isLoading}
                  autoCapitalize="characters"
                />
              </View>

              {/* 
              <View style={styles.dataContainer}>
                <Text style={styles.dataLabel}>DATA PAYLOAD</Text>
                <Text style={styles.dataValue} numberOfLines={2}>
                  {qrData}
                </Text>
              </View> 
              */}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by R8 Scanner</Text>
              </View>
            </View>
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
    padding: 20,
  },
  card: {
    width: 320,
    borderRadius: 30,
    backgroundColor: Colors.backgroundSecondary, // Fallback
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    zIndex: 1,
  },
  watermarkContainer: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 1,
  },
  watermarkText: {
    fontSize: 180,
    fontWeight: '900',
    color: '#000',
    opacity: 0.05,
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    padding: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  qrContainer: {
    marginTop: 10,
    marginBottom: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrInnerContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  qrGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    backgroundColor: '#fff',
    borderRadius: 130,
    opacity: 0.15,
    zIndex: -1,
    transform: [{ scale: 1.1 }],
  },
  scanMeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 25,
    marginTop: 5,
  },
  userInfo: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nameInputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
    marginBottom: 15,
    paddingBottom: 5,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  dataContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dataValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 5,
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
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

