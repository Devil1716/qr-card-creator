import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Full width minus padding
const CARD_HEIGHT = CARD_WIDTH / 1.586; // Credit card aspect ratio

const PassCard = ({
    userData,
    flipped = false,
    onFlip
}) => {
    // Animation Value: 0 (Front) -> 1 (Back)
    const flipAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(flipAnim, {
            toValue: flipped ? 1 : 0,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
    }, [flipped]);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onFlip) onFlip(!flipped);
    };

    // Interpolations
    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 0.5, 1],
        outputRange: [1, 1, 0, 0],
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 0.5, 1],
        outputRange: [0, 0, 1, 1],
    });

    const renderFrontValues = () => (
        <>
            <View style={styles.cardHeader}>
                <View style={styles.chipContainer}>
                    <Ionicons name="hardware-chip-outline" size={32} color="rgba(255,255,255,0.6)" />
                    <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.4)" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
                <Text style={styles.brandText}>R8</Text>
            </View>

            <View style={styles.cardBody}>
                <View>
                    <Text style={styles.label}>PASSHOLDER</Text>
                    <Text style={styles.valueLarge} numberOfLines={1}>{userData?.name || 'STUDENT NAME'}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.label}>BUS ROUTE</Text>
                    <Text style={styles.value}>{userData?.busId || 'NOT ASSIGNED'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.label}>STOP ID</Text>
                    <Text style={styles.value}>{userData?.stopId || '---'}</Text>
                </View>
            </View>
        </>
    );

    const renderBackValues = () => (
        <View style={styles.backContainer}>
            <View style={styles.magnetStrip} />

            <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                    <QRCode
                        value={userData?.id || 'NO_ID'}
                        size={120}
                        color="#000"
                        backgroundColor="#fff"
                    />
                </View>
                <Text style={styles.tapText}>Scan to Verify</Text>
                <Text style={styles.idText}>ID: {userData?.id?.substring(0, 8) || 'Unknown'}...</Text>
            </View>

            <View style={styles.backFooter}>
                <Text style={styles.supportText}>R8 Transport System • r8.bus/support</Text>
            </View>
        </View>
    );

    // Front Face Style
    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }],
        opacity: frontOpacity,
        zIndex: flipped ? 0 : 1, // Fix for touch events on Android?
    };

    // Back Face Style
    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }],
        opacity: backOpacity,
        zIndex: flipped ? 1 : 0,
    };

    const GRADIENT_COLORS = userData?.busId
        ? Colors.gradients.primary
        : ['#475569', '#1e293b']; // Slate for unassigned

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={handlePress}
            style={styles.container}
        >
            {/* Front Card */}
            <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
                <LinearGradient
                    colors={GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    {/* Noise texture overlay could go here */}
                    <View style={styles.glow} />
                    {renderFrontValues()}
                </LinearGradient>
            </Animated.View>

            {/* Back Card */}
            <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                <View style={[styles.gradient, { backgroundColor: '#1e293b' }]}>
                    {renderBackValues()}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginVertical: 10,
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        position: 'absolute',
        backfaceVisibility: 'hidden', // Critical for 3D flip
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    gradient: {
        flex: 1,
        borderRadius: 16,
        padding: 24,
        overflow: 'hidden',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    glow: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.1)',
        transform: [{ scale: 1.5 }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    chipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    brandText: {
        fontSize: 24,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.9)',
        fontStyle: 'italic',
    },
    cardBody: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 10,
    },
    label: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    valueLarge: {
        fontSize: 22,
        color: '#fff',
        fontWeight: '700',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    value: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    // Back Styles
    backContainer: {
        flex: 1,
        margin: -24, // Counteract padding
        backgroundColor: '#1E293B',
        borderRadius: 16,
    },
    magnetStrip: {
        height: 40,
        backgroundColor: '#000',
        marginTop: 20,
        width: '100%',
    },
    qrContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    qrWrapper: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    tapText: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    idText: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    backFooter: {
        padding: 12,
        alignItems: 'center',
    },
    supportText: {
        color: Colors.textMuted,
        fontSize: 8,
    }
});

export default PassCard;
