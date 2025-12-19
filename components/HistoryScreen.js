import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { deleteCardFromStorage } from '../utils/storage';
import { ErrorMessages, SuccessMessages } from '../utils/errors';
import * as Sharing from 'expo-sharing';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={onBack} 
          style={styles.backButton}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Scanned History</Text>
          {cards.length > 0 && (
            <Text style={styles.subtitle}>{cards.length} {cards.length === 1 ? 'card' : 'cards'}</Text>
          )}
        </View>
      </View>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id || index}
            style={styles.card}
            onPress={() => handleCardPress(card)}
            activeOpacity={0.9}
          >
            {card.imageUri ? (
              <View style={styles.cardImageContainer}>
                <Image
                  source={{ uri: card.imageUri }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.cardImageOverlay} />
              </View>
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Ionicons name="qr-code-outline" size={48} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="qr-code" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(card.id);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Delete card"
                  accessibilityRole="button"
                >
                  <View style={styles.deleteButtonInner}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.cardDataContainer}>
                <Text style={styles.cardData} numberOfLines={2}>{card.data}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.cardTime}>{card.timestamp}</Text>
                <View style={styles.viewDetailsHint}>
                  <Ionicons name="eye-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.viewDetailsText}>Tap to view details</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {cards.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="folder-open-outline" size={80} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No saved cards yet</Text>
            <Text style={styles.emptySubtext}>Scan a QR code to get started!</Text>
          </View>
        )}
      </ScrollView>

      {/* Card Details Modal */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedCard && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Card Details</Text>
                  <TouchableOpacity
                    onPress={() => setShowDetails(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  {selectedCard.imageUri && (
                    <Image
                      source={{ uri: selectedCard.imageUri }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  )}
                  
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Name</Text>
                    <Text style={styles.modalValue}>{selectedCard.name}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>QR Code Data</Text>
                    <View style={styles.modalDataContainer}>
                      <Text style={styles.modalDataText} selectable>{selectedCard.data}</Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Created</Text>
                    <Text style={styles.modalValue}>{selectedCard.timestamp}</Text>
                  </View>

                  {selectedCard.imageUri && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>File Location</Text>
                      <Text style={styles.modalFileLocation} numberOfLines={2}>{selectedCard.imageUri}</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.shareButton]}
                    onPress={() => {
                      handleShareCard(selectedCard);
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color={Colors.text} />
                    <Text style={styles.modalButtonText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButtonModal]}
                    onPress={() => {
                      setShowDetails(false);
                      handleDeleteCard(selectedCard.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.text} />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.border,
  },
  cardImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    flex: 1,
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  deleteButton: {
    marginLeft: 8,
  },
  deleteButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDataContainer: {
    backgroundColor: Colors.backgroundTertiary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardData: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'space-between',
  },
  cardTime: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  viewDetailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  viewDetailsText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  modalDataContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalDataText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  modalFileLocation: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    gap: 8,
  },
  shareButton: {
    backgroundColor: Colors.primary,
  },
  deleteButtonModal: {
    backgroundColor: Colors.error,
  },
  modalButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

HistoryScreen.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      data: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      imageUri: PropTypes.string,
    })
  ).isRequired,
  onBack: PropTypes.func.isRequired,
  onCardDeleted: PropTypes.func.isRequired,
};

export default HistoryScreen;

