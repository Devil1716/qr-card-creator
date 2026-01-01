import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';
import cardEncryption from '../services/CardEncryption';
import { Colors } from '../../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

const FloatingCard = ({
    card,
    index = 0,
    isActive = false,
    onPress = () => { },
    onEdit = () => { },
    onDelete = () => { },
    onShare = () => { }
}) => {
    const [decryptedData, setDecryptedData] = useState(null);
    const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.9)).current;
    const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.6)).current;

    // Decrypt card data on mount
    useEffect(() => {
        const decrypt = async () => {
            const data = await cardEncryption.decryptCard(card);
            setDecryptedData(data);
        };
        decrypt();
    }, [card]);

    // Animate when active state changes
    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: isActive ? 1 : 0.9,
                useNativeDriver: true,
                tension: 50,
                friction: 10
            }),
            Animated.timing(opacityAnim, {
                toValue: isActive ? 1 : 0.6,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    }, [isActive]);

    const handleDelete = () => {
        Alert.alert(
            'Delete Card',
            'Are you sure you want to delete this card?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(card.id)
                }
            ]
        );
    };

    const getCardGradientColor = () => {
        const colors = {
            '#3B82F6': ['rgba(59, 130, 246, 0.3)', 'rgba(37, 99, 235, 0.2)'],
            '#10B981': ['rgba(16, 185, 129, 0.3)', 'rgba(5, 150, 105, 0.2)'],
            '#F59E0B': ['rgba(245, 158, 11, 0.3)', 'rgba(217, 119, 6, 0.2)'],
            '#EF4444': ['rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.2)'],
            '#8B5CF6': ['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.2)']
        };
        return colors[card.metadata?.color] || colors['#3B82F6'];
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { scale: scaleAnim },
                        { translateY: index * 10 }
                    ],
                    opacity: opacityAnim,
                    zIndex: isActive ? 10 : 10 - index
                }
            ]}
        >
            <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
                <BlurView intensity={40} style={styles.card} tint="dark">
                    {/* Card Header */}
                    <View style={styles.header}>
                        <View style={styles.labelContainer}>
                            <View
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: card.metadata?.color || Colors.primary }
                                ]}
                            />
                            <Text style={styles.label}>{card.metadata?.label || 'Bus Pass'}</Text>
                        </View>
                        <Text style={styles.date}>
                            {new Date(card.createdAt).toLocaleDateString()}
                        </Text>
                    </View>

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        {decryptedData?.raw ? (
                            <View style={styles.qrWrapper}>
                                <QRCode
                                    value={decryptedData.raw}
                                    size={120}
                                    backgroundColor="transparent"
                                    color={Colors.text}
                                />
                            </View>
                        ) : (
                            <View style={styles.qrPlaceholder}>
                                <Ionicons name="qr-code-outline" size={60} color={Colors.textSecondary} />
                            </View>
                        )}
                    </View>

                    {/* Card Footer - Actions */}
                    {isActive && (
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(card)}>
                                <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
                                <Text style={styles.actionText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={() => onShare(card)}>
                                <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
                                <Text style={styles.actionText}>Share</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                                <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Validity Indicator */}
                    <View style={styles.validityBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                        <Text style={styles.validityText}>Valid</Text>
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        marginHorizontal: 24,
        position: 'absolute'
    },
    card: {
        borderRadius: 20,
        padding: 20,
        minHeight: CARD_HEIGHT,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    label: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text
    },
    date: {
        fontSize: 12,
        color: Colors.textSecondary
    },
    qrContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 16
    },
    qrWrapper: {
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12
    },
    qrPlaceholder: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)'
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12
    },
    actionText: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500'
    },
    validityBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    validityText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.success
    }
});

export default FloatingCard;
