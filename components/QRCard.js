import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
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
  onSave,
  onShare,
  onScanAgain,
  isLoading = false,
}) => {
  return (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
      <View style={styles.card}>
        <View style={styles.gradient}>
          <View style={styles.pattern} />
        </View>

        <View style={styles.content}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.badgeText}>VERIFIED</Text>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={qrData || 'No Data'}
              size={CARD_DEFAULTS.QR_SIZE}
              color={Colors.backgroundSecondary}
              backgroundColor={Colors.cardBackground}
            />
          </View>

          <View style={styles.userInfo}>
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

            <View style={styles.divider} />

            <View style={styles.dataContainer}>
              <Text style={styles.dataLabel}>QR CODE DATA</Text>
              <Text style={styles.dataValue} numberOfLines={3}>
                {qrData}
              </Text>
            </View>

            <View style={styles.timestampContainer}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.timestamp}>
                Created: {new Date().toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 20,
    borderRadius: 24,
    backgroundColor: Colors.cardBackground,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    height: 80,
    backgroundColor: Colors.cardGradient,
    position: 'relative',
  },
  pattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlayLight,
  },
  content: {
    padding: 25,
    alignItems: 'center',
    marginTop: -40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.badgeBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
    gap: 5,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  userInfo: {
    width: '100%',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.backgroundSecondary,
    textAlign: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 10,
  },
  dataContainer: {
    backgroundColor: Colors.dataBackground,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  dataLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 14,
    color: Colors.backgroundSecondary,
    lineHeight: 20,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});

export default QRCard;

