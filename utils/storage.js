import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Load saved QR cards from storage
 * @returns {Promise<Array>} Array of saved cards
 */
export const loadSavedCards = async () => {
  try {
    const storedCards = await AsyncStorage.getItem(STORAGE_KEYS.QR_CARDS);
    if (storedCards !== null) {
      return JSON.parse(storedCards);
    }
    return [];
  } catch (error) {
    console.error('Failed to load cards:', error);
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
    console.error('Failed to save cards:', error);
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
    console.error('Failed to add card:', error);
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
    console.error('Failed to delete card:', error);
    return false;
  }
};

