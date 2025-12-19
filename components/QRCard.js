import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
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
        <View style={styles.gradient}>
          <View style={styles.gradientPattern} />
          <View style={styles.gradientOverlay} />
        </View>

        <View style={styles.content}>
          <View style={styles.badge}>
            <View style={styles.badgeIconContainer}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.badgeText}>VERIFIED</Text>
          </View>

          <View style={styles.qrContainer}>
            <View style={styles.qrInnerContainer}>
              <QRCode
                value={qrData || 'No Data'}
                size={CARD_DEFAULTS.QR_SIZE}
                color={Colors.backgroundSecondary}
                backgroundColor={Colors.cardBackground}
              />
            </View>
            <View style={styles.qrGlow} />
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameInputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} style={styles.nameIcon} />
              <TextInput
                style={styles.nameInput}
                placeholder="Enter Your Name"
                placeholderTextColor={Colors.textMuted}
                value={userName}
                onChangeText={onNameChange}
                maxLength={CARD_DEFAULTS.MAX_NAME_LENGTH}
                editable={!isLoading}
                accessibilityLabel="Enter your name"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.dataContainer}>
              <View style={styles.dataLabelContainer}>
                <Ionicons name="code-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.dataLabel}>QR CODE DATA</Text>
              </View>
              <Text style={styles.dataValue} numberOfLines={3}>
                {qrData}
              </Text>
            </View>

            <View style={styles.timestampContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.timestamp}>
                Created: {new Date().toLocaleString()}
              </Text>
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
  },
  card: {
    margin: 20,
    borderRadius: 28,
    backgroundColor: Colors.cardBackground,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  gradient: {
    height: 100,
    backgroundColor: Colors.primary,
    position: 'relative',
  },
  gradientPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlayLight,
    opacity: 0.3,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.secondary,
    opacity: 0.2,
  },
  content: {
    padding: 28,
    alignItems: 'center',
    marginTop: -50,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.badgeBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  qrContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  qrInnerContainer: {
    padding: 24,
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  qrGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    opacity: 0.05,
    zIndex: -1,
  },
  userInfo: {
    width: '100%',
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    marginBottom: 18,
    paddingBottom: 12,
  },
  nameIcon: {
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.backgroundSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 16,
  },
  dataContainer: {
    backgroundColor: Colors.dataBackground,
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  dataLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  dataLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  dataValue: {
    fontSize: 15,
    color: Colors.backgroundSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
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

