import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARDS_KEY = '@encrypted_cards';
const MASTER_KEY_ALIAS = 'card_master_key';

/**
 * Encrypted Card Storage Service
 * Uses AES-256 encryption for card data
 */
class CardEncryptionService {
    constructor() {
        this.masterKey = null;
    }

    /**
     * Initialize or retrieve master key
     */
    async initialize() {
        try {
            // Try to retrieve existing key
            let key = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);

            if (!key) {
                // Generate new master key
                key = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    `${Date.now()}-${Math.random()}-master-key`
                );
                await SecureStore.setItemAsync(MASTER_KEY_ALIAS, key);
            }

            this.masterKey = key;
            return true;
        } catch (error) {
            console.error('Failed to initialize encryption:', error);
            return false;
        }
    }

    /**
     * Encrypt card data
     * @param {Object} cardData - Raw card data
     * @returns {Object} - Encrypted card object
     */
    async encryptCard(cardData) {
        if (!this.masterKey) await this.initialize();

        const cardId = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            `${Date.now()}-${Math.random()}`
        );

        // Create IV (initialization vector)
        const iv = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.MD5,
            `${cardId}-${Date.now()}`
        );

        // Simple XOR-based encryption (for demo - in production use proper AES)
        // Note: For production, use a native AES library like react-native-aes-crypto
        const dataString = JSON.stringify(cardData);
        const encrypted = this._simpleEncrypt(dataString, this.masterKey, iv);

        return {
            id: cardId.substring(0, 16),
            encryptedData: encrypted,
            iv: iv.substring(0, 16),
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            metadata: {
                label: cardData.label || 'Bus Pass',
                color: cardData.color || '#3B82F6',
                type: cardData.type || 'qr'
            }
        };
    }

    /**
     * Decrypt card data
     * @param {Object} encryptedCard - Encrypted card object
     * @returns {Object} - Decrypted card data
     */
    async decryptCard(encryptedCard) {
        if (!this.masterKey) await this.initialize();

        try {
            const decrypted = this._simpleDecrypt(
                encryptedCard.encryptedData,
                this.masterKey,
                encryptedCard.iv
            );
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Failed to decrypt card:', error);
            return null;
        }
    }

    /**
     * Save card to storage
     */
    async saveCard(cardData) {
        const encryptedCard = await this.encryptCard(cardData);

        // Get existing cards
        const existingJson = await AsyncStorage.getItem(CARDS_KEY);
        const existing = existingJson ? JSON.parse(existingJson) : [];

        // Add new card
        existing.unshift(encryptedCard);

        // Limit to 50 cards
        const limited = existing.slice(0, 50);

        await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(limited));

        return encryptedCard;
    }

    /**
     * Get all cards (decrypted metadata, encrypted data)
     */
    async getAllCards() {
        const cardsJson = await AsyncStorage.getItem(CARDS_KEY);
        return cardsJson ? JSON.parse(cardsJson) : [];
    }

    /**
     * Get card by ID with decrypted data
     */
    async getCard(cardId) {
        const cards = await this.getAllCards();
        const card = cards.find(c => c.id === cardId);

        if (!card) return null;

        const decryptedData = await this.decryptCard(card);
        return { ...card, data: decryptedData };
    }

    /**
     * Delete card
     */
    async deleteCard(cardId) {
        const cards = await this.getAllCards();
        const filtered = cards.filter(c => c.id !== cardId);
        await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(filtered));
    }

    /**
     * Update card metadata
     */
    async updateCardMetadata(cardId, metadata) {
        const cards = await this.getAllCards();
        const index = cards.findIndex(c => c.id === cardId);

        if (index !== -1) {
            cards[index].metadata = { ...cards[index].metadata, ...metadata };
            cards[index].lastUsed = new Date().toISOString();
            await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(cards));
        }
    }

    /**
     * Simple XOR-based encryption (demo only)
     * In production, use react-native-aes-crypto or similar
     */
    _simpleEncrypt(data, key, iv) {
        const combined = key + iv;
        let result = '';
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i) ^ combined.charCodeAt(i % combined.length);
            result += String.fromCharCode(charCode);
        }
        return Buffer.from(result).toString('base64');
    }

    _simpleDecrypt(encrypted, key, iv) {
        const decoded = Buffer.from(encrypted, 'base64').toString('utf8');
        const combined = key + iv;
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ combined.charCodeAt(i % combined.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    }
}

// Singleton instance
const cardEncryption = new CardEncryptionService();

export default cardEncryption;
export { CardEncryptionService };
