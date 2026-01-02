import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const FluidButton = ({
    onPress,
    title,
    icon,
    type = 'primary', // primary, success, danger, ghost
    size = 'medium', // small, medium, large
    disabled = false,
    isLoading = false,
    style
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    // Shimmer effect for primary buttons
    useEffect(() => {
        if (type === 'primary' && !disabled && !isLoading) {
            const shimmerLoop = Animated.loop(
                Animated.sequence([
                    Animated.delay(3000), // Wait before shimmer
                    Animated.timing(shimmerAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.cubic),
                    }),
                    Animated.timing(shimmerAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
            shimmerLoop.start();
            return () => shimmerLoop.stop();
        }
    }, [type, disabled, isLoading]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.94,
            useNativeDriver: true,
            friction: 9,
            tension: 40
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 80
        }).start();
    };

    const getColors = () => {
        if (disabled) return [Colors.textMuted, Colors.textMuted];
        switch (type) {
            case 'primary': return Colors.gradients.primary;
            case 'success': return Colors.gradients.success;
            case 'danger': return Colors.gradients.danger;
            case 'ghost': return ['transparent', 'transparent'];
            default: return Colors.gradients.primary;
        }
    };

    const getContainerStyle = () => {
        const base = {
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            overflow: 'hidden',
        };
        switch (size) {
            case 'small': return { ...base, paddingVertical: 8, paddingHorizontal: 16 };
            case 'large': return { ...base, paddingVertical: 18, paddingHorizontal: 32 };
            default: return { ...base, paddingVertical: 14, paddingHorizontal: 24 };
        }
    };

    const getTextStyle = () => {
        const base = { fontWeight: '600', letterSpacing: 0.5 };
        switch (size) {
            case 'small': return { ...base, fontSize: 13 };
            case 'large': return { ...base, fontSize: 18 };
            default: return { ...base, fontSize: 16 };
        }
    };

    // Shimmer translate interpolation
    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-150, 300],
    });

    const content = (
        <LinearGradient
            colors={getColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[getContainerStyle(), type === 'ghost' && styles.ghostBorder]}
        >
            {/* Shimmer Overlay */}
            {type === 'primary' && !disabled && !isLoading && (
                <Animated.View
                    style={[
                        styles.shimmer,
                        { transform: [{ translateX: shimmerTranslate }] }
                    ]}
                />
            )}

            {icon && <Ionicons name={icon} size={size === 'large' ? 24 : 20} color={type === 'ghost' ? Colors.text : '#fff'} />}
            {title && (
                <Text style={[getTextStyle(), { color: type === 'ghost' ? Colors.text : '#fff' }]}>
                    {title}
                </Text>
            )}
        </LinearGradient>
    );

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <TouchableOpacity
                onPress={!disabled && !isLoading ? onPress : null}
                onPressIn={!disabled && !isLoading ? handlePressIn : null}
                onPressOut={!disabled && !isLoading ? handlePressOut : null}
                activeOpacity={1}
                disabled={disabled || isLoading}
                style={styles.touchable}
            >
                {content}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    touchable: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    ghostBorder: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 80,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.25)',
        transform: [{ skewX: '-20deg' }],
    },
});

export default FluidButton;

