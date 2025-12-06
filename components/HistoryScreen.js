import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { deleteCardFromStorage } from '../utils/storage';
import { ErrorMessages, SuccessMessages } from '../utils/errors';

const HistoryScreen = ({ cards, onBack, onCardDeleted }) => {
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
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Scanned History</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {cards.map((card, index) => (
          <View key={card.id || index} style={styles.card}>
            {card.imageUri ? (
              <Image
                source={{ uri: card.imageUri }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons name="qr-code" size={20} color={Colors.primary} />
                <Text style={styles.cardName}>{card.name}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCard(card.id)}
                  accessibilityLabel="Delete card"
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardData} numberOfLines={2}>{card.data}</Text>
              <Text style={styles.cardTime}>{card.timestamp}</Text>
            </View>
          </View>
        ))}
        {cards.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No saved cards yet.</Text>
            <Text style={styles.emptySubtext}>Scan a QR code to get started!</Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.border,
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  cardName: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  cardData: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 5,
  },
  cardTime: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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

