import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import * as FileSystem from 'expo-file-system';
import logger from './logger';

/**
 * Load saved QR cards from storage
 * @returns {Promise<Array>} Array of saved cards
 */
// Helper to construct current path
const getCurrentImagePath = (fileName) => {
  const baseDir = FileSystem.documentDirectory;
  return `${baseDir}QRCards/${fileName}`;
};

/**
 * Load saved QR cards from storage
 * @returns {Promise<Array>} Array of saved cards
 */
export const loadSavedCards = async () => {
  try {
    const storedCards = await AsyncStorage.getItem(STORAGE_KEYS.QR_CARDS);
    if (storedCards !== null) {
      const parsedCards = JSON.parse(storedCards);

      // Fix paths dynamically on load
      return parsedCards.map(card => {
        // If we have a fileName, rebuild the path
        if (card.fileName) {
          return {
            ...card,
            imageUri: getCurrentImagePath(card.fileName)
          };
        }

        // Legacy Support: Attempt to extract filename from old absolute path if it exists
        if (card.imageUri) {
          try {
            // Handle both / and \ paths just in case
            const cleanPath = card.imageUri.replace(/\\/g, '/');
            const extractedName = cleanPath.split('/').pop();
            if (extractedName && (extractedName.endsWith('.png') || extractedName.endsWith('.jpg'))) {
              // It's a valid looking filename, let's use it relative to current doc dir
              return {
                ...card,
                fileName: extractedName, // Save it for next time (implicit migration in memory)
                imageUri: getCurrentImagePath(extractedName)
              };
            }
          } catch (err) {
            console.warn('Failed to migrate legacy path:', card.imageUri);
          }
        }

        return card;
      });
    }
    return [];
  } catch (error) {
    logger.error('Failed to load cards:', error);
    return [];
  }
};

/**
 * Save QR cards to storage
 * @param {Array} cards - Array of cards to save
 * @returns {Promise<boolean>} Success status
 */
export const saveCardsToStorage = async (cards) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.QR_CARDS, JSON.stringify(cards));
    return true;
  } catch (error) {
    logger.error('Failed to save cards:', error);
    return false;
  }
};

/**
 * Add a new card to storage
 * @param {Object} newCard - Card object to add
 * @param {Array} existingCards - Current array of cards
 * @returns {Promise<boolean>} Success status
 */
export const addCardToStorage = async (newCard, existingCards = []) => {
  try {
    const updatedCards = [...existingCards, newCard];
    return await saveCardsToStorage(updatedCards);
  } catch (error) {
    logger.error('Failed to add card:', error);
    return false;
  }
};

/**
 * Delete a card from storage
 * @param {string} cardId - ID of card to delete
 * @param {Array} existingCards - Current array of cards
 * @returns {Promise<boolean>} Success status
 */
export const deleteCardFromStorage = async (cardId, existingCards = []) => {
  try {
    const updatedCards = existingCards.filter(card => card.id !== cardId);
    return await saveCardsToStorage(updatedCards);
  } catch (error) {
    logger.error('Failed to delete card:', error);
    return false;
  }
};

