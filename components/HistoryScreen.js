
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { deleteCardFromStorage } from '../utils/storage';
import { ErrorMessages, SuccessMessages } from '../utils/errors';
import * as Sharing from 'expo-sharing';
import GlassCard from './GlassCard';
import GlassBackground from './GlassBackground';

const HistoryScreen = ({ cards, onBack, onCardDeleted }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleCardPress = (card) => {
    setSelectedCard(card);
    setShowDetails(true);
  };

  const handleShareCard = async (card) => {
    try {
      if (card.imageUri) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(card.imageUri);
        } else {
          Alert.alert('Error', 'Sharing is not available on this device.');
        }
      } else {
        Alert.alert('Error', 'Card image not found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share card.');
    }
  };

  const handleDeleteCard = async (cardId) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCardFromStorage(cardId, cards);
            if (success) {
              Alert.alert('Success', SuccessMessages.DELETED);
              onCardDeleted();
            } else {
              Alert.alert('Error', ErrorMessages.DELETE_FAILED);
            }
          },
        },
      ]
    );
  };

  return (
    <GlassBackground>
      {/* Header - Viewing Area (Top 25%) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.displayTitle}>History</Text>
          <Text style={styles.displaySubtitle}>
            {cards.length} {cards.length === 1 ? 'Scan' : 'Scans'} Saved
          </Text>
        </View>
      </View>

      {/* Content - Interaction Area (Bottom 75%) */}
      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {cards.length > 0 ? (
            cards.map((card, index) => (
              <GlassCard
                key={card.id || index}
                onPress={() => handleCardPress(card)}
                style={styles.cardSpacing}
              >
                <View style={styles.cardRow}>
                  {/* Tiny Preview Image */}
                  <View style={styles.previewContainer}>
                    {card.imageUri ? (
                      <Image
                        source={{ uri: card.imageUri }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="qr-code" size={24} color={Colors.textMuted} />
                    )}
                  </View>

                  {/* Text Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                    <Text style={styles.cardTime}>{card.timestamp}</Text>
                  </View>

                  {/* Delete Action */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteAction}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))
          ) : (
            <View style={styles.emptyState}>
              <GlassCard>
                <View style={styles.emptyContent}>
                  <Ionicons name="layers-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No Scans Yet</Text>
                  <Text style={styles.emptyDesc}>Your saved QR cards will appear here.</Text>
                </View>
              </GlassCard>
            </View>
          )}
          {/* Spacer for bottom safe area */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Card Details Modal - Full Glass Overlay */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalGlassContainer}>
            {selectedCard && (
              <GlassCard intensity={80} style={styles.modalCard} width="90%">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detail View</Text>
                  <TouchableOpacity onPress={() => setShowDetails(false)}>
                    <Ionicons name="close-circle" size={32} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalImageWrapper}>
                  {selectedCard.imageUri ? (
                    <Image
                      source={{ uri: selectedCard.imageUri }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.modalNoImage}>
                      <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
                    </View>
                  )}
                </View>

                <View style={styles.modalMeta}>
                  <Text style={styles.modalNameLabel}>NAME</Text>
                  <Text style={styles.modalNameValue}>{selectedCard.name}</Text>

                  <Text style={styles.modalNameLabel}>CREATED</Text>
                  <Text style={styles.modalTimeValue}>{selectedCard.timestamp}</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                    onPress={() => handleShareCard(selectedCard)}
                  >
                    <Ionicons name="share-social" size={20} color={Colors.text} />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Colors.glass.backgroundLight, borderWidth: 1, borderColor: Colors.error }]}
                    onPress={() => {
                      setShowDetails(false);
                      handleDeleteCard(selectedCard.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}
          </View>
        </View>
      </Modal>
    </GlassBackground>
  );
};

const styles = StyleSheet.create({
  // Section 1: Viewing (Headings) - Top 25%
  header: {
    height: '25%',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: Colors.glass.backgroundLight,
  },
  titleContainer: {
    gap: 4,
  },
  displayTitle: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: '300', // Light font weight for premium feel
    letterSpacing: -1,
  },
  displaySubtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Section 2: Interaction (List) - Bottom 75%
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Let glass background show
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardTime: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  deleteAction: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // error color low opacity
    borderRadius: 12,
  },

  // Empty State
  emptyState: {
    paddingTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGlassContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalCard: {
    padding: 0, // Reset default padding from GlassCard to handle custom inner layout
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  modalImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalNoImage: {
    alignItems: 'center',
  },
  modalMeta: {
    marginBottom: 24,
    gap: 6,
  },
  modalNameLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalNameValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalTimeValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '400',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 25, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

HistoryScreen.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.object).isRequired,
  onBack: PropTypes.func.isRequired,
  onCardDeleted: PropTypes.func.isRequired,
};

export default HistoryScreen;

