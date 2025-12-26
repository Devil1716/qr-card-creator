import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const GlassCard = ({
    children,
    style,
    onPress,
    intensity = 20,
    width = '100%',
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

    const CardContent = () => (
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }], width }]}>
            {/* 1px Gradient Border */}
            <LinearGradient
                colors={Colors.gradients.glassBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.borderGradient, style]}
            >
                <View style={styles.innerContainer}>
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={intensity} style={styles.blur} tint="dark">
                            <View style={styles.content}>
                                {children}
                            </View>
                        </BlurView>
                    ) : (
                        // Android Fallback (BlurView can be heavy on legacy android, using translucent bg)
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
                <CardContent />
            </TouchableOpacity>
        );
    }

    return <CardContent />;
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        borderRadius: 24,
        shadowColor: Colors.glass.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    borderGradient: {
        borderRadius: 24,
        padding: 1, // 1px border width
    },
    innerContainer: {
        borderRadius: 23, // 1px less than parent
        overflow: 'hidden',
        backgroundColor: Colors.glass.background,
    },
    blur: {
        width: '100%',
        padding: 20,
    },
    androidBlur: {
        backgroundColor: 'rgba(30, 30, 40, 0.85)',
    },
    content: {
        // Content layout
    }
});

export default GlassCard;
