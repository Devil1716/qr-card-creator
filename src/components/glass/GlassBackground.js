import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GlassBackground = ({ children, style }) => {
    // Aurora blob animations
    const blob1Anim = useRef(new Animated.Value(0)).current;
    const blob2Anim = useRef(new Animated.Value(0)).current;
    const blob3Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Blob 1: Slow drift (20s loop)
        Animated.loop(
            Animated.timing(blob1Anim, {
                toValue: 1,
                duration: 20000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
            })
        ).start();

        // Blob 2: Medium drift (15s loop, offset)
        Animated.loop(
            Animated.timing(blob2Anim, {
                toValue: 1,
                duration: 15000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
            })
        ).start();

        // Blob 3: Slow pulse (18s loop)
        Animated.loop(
            Animated.timing(blob3Anim, {
                toValue: 1,
                duration: 18000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
            })
        ).start();
    }, []);

    // Interpolations for smooth looping transforms
    const blob1Transform = {
        translateX: blob1Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 50, 0],
        }),
        translateY: blob1Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 30, 0],
        }),
        scale: blob1Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.15, 1],
        }),
    };

    const blob2Transform = {
        translateX: blob2Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, -40, 0],
        }),
        translateY: blob2Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 60, 0],
        }),
        scale: blob2Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1.1, 0.9, 1.1],
        }),
    };

    const blob3Transform = {
        translateX: blob3Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 30, 0],
        }),
        translateY: blob3Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, -40, 0],
        }),
        scale: blob3Anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.2, 1],
        }),
    };

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={Colors.gradients.background}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Aurora Blob 1 - Electric Blue (Top Left) */}
                <Animated.View
                    style={[
                        styles.auroraBlob,
                        styles.blob1,
                        {
                            transform: [
                                { translateX: blob1Transform.translateX },
                                { translateY: blob1Transform.translateY },
                                { scale: blob1Transform.scale },
                            ],
                        },
                    ]}
                />

                {/* Aurora Blob 2 - Amber Glow (Bottom Right) */}
                <Animated.View
                    style={[
                        styles.auroraBlob,
                        styles.blob2,
                        {
                            transform: [
                                { translateX: blob2Transform.translateX },
                                { translateY: blob2Transform.translateY },
                                { scale: blob2Transform.scale },
                            ],
                        },
                    ]}
                />

                {/* Aurora Blob 3 - Green Accent (Center Right) */}
                <Animated.View
                    style={[
                        styles.auroraBlob,
                        styles.blob3,
                        {
                            transform: [
                                { translateX: blob3Transform.translateX },
                                { translateY: blob3Transform.translateY },
                                { scale: blob3Transform.scale },
                            ],
                        },
                    ]}
                />

                <View style={styles.content}>
                    {children}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    gradient: {
        flex: 1,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        zIndex: 2,
    },
    // Aurora Blob Base Style
    auroraBlob: {
        position: 'absolute',
        borderRadius: 999,
    },
    // Blob 1: Large Electric Blue (Top Left)
    blob1: {
        top: -SCREEN_HEIGHT * 0.15,
        left: -SCREEN_WIDTH * 0.2,
        width: SCREEN_WIDTH * 0.9,
        height: SCREEN_WIDTH * 0.9,
        backgroundColor: Colors.primary,
        opacity: 0.15,
    },
    // Blob 2: Amber Glow (Bottom Right)
    blob2: {
        bottom: -SCREEN_HEIGHT * 0.1,
        right: -SCREEN_WIDTH * 0.15,
        width: SCREEN_WIDTH * 0.75,
        height: SCREEN_WIDTH * 0.75,
        backgroundColor: Colors.accent,
        opacity: 0.1,
    },
    // Blob 3: Green Accent (Center Right)
    blob3: {
        top: SCREEN_HEIGHT * 0.35,
        right: -SCREEN_WIDTH * 0.3,
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.5,
        backgroundColor: Colors.secondary,
        opacity: 0.08,
    },
});

export default GlassBackground;

