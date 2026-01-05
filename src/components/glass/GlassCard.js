import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Colors } from '../../constants/colors';

const GlassCard = ({
    children,
    style,
    onPress,
    intensity = 40, // Deeper blur for One UI look
    width = '100%',
    variant = 'default', // 'default' | 'prism'
    header,
    footer
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            friction: 8,
            tension: 100,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8, // Bouncy return
            tension: 40,
        }).start();
    };

    const isPrism = variant === 'prism';
    const borderColors = isPrism ? Colors.gradients.prismBorder : Colors.gradients.glassBorder;
    const shadowColor = isPrism ? 'rgba(0, 243, 255, 0.4)' : Colors.glass.shadow; // Cyan glow for prism

    const content = (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: scaleAnim }],
                    width,
                    shadowColor: shadowColor
                },
                style // Apply layout styles here
            ]}
        >
            {/* 1px (or 2px for prism) Gradient Border */}
            <LinearGradient
                colors={borderColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.borderGradient, isPrism && { padding: 1.5 }]} // Thicker border for prism
            >
                <View style={[styles.innerContainer, isPrism && { borderRadius: 26.5 }]}>
                    {/* Lighting Engine: Radial Gradient Overlay */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <Svg height="100%" width="100%">
                            <Defs>
                                <RadialGradient
                                    id="grad"
                                    cx="0"
                                    cy="0"
                                    rx="100%"
                                    ry="100%"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <Stop offset="0" stopColor="white" stopOpacity={isPrism ? "0.25" : "0.15"} />
                                    <Stop offset="1" stopColor="white" stopOpacity="0" />
                                </RadialGradient>
                            </Defs>
                            <Rect
                                x="0"
                                y="0"
                                width="100%"
                                height="100%"
                                fill="url(#grad)"
                            />
                        </Svg>
                    </View>

                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={intensity} style={styles.blur} tint="dark">
                            <View style={styles.content}>
                                {children}
                            </View>
                        </BlurView>
                    ) : (
                        <View style={[styles.blur, styles.androidBlur]}>
                            <View style={styles.content}>
                                {children}
                            </View>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </Animated.View>
    );
    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        borderRadius: 28, // More rounded (Harmony OS style)
        shadowColor: Colors.glass.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
    },
    borderGradient: {
        borderRadius: 28,
        padding: 0.8, // Ultra-thin border
    },
    innerContainer: {
        borderRadius: 27.2,
        overflow: 'hidden',
        backgroundColor: Colors.glass.background,
    },
    blur: {
        width: '100%',
        padding: 24, // More breathing room
    },
    androidBlur: {
        backgroundColor: 'rgba(20, 20, 25, 0.92)', // Slightly more opaque on Android for readability
    },
    content: {
        // Content layout
    }
});

export default GlassCard;
