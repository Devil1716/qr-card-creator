import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolate,
    useDerivedValue
} from 'react-native-reanimated';
import { Gyroscope } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ThreeDCard = ({ children, style }) => {
    // Shared values for rotation
    const rotateX = useSharedValue(0);
    const rotateY = useSharedValue(0);

    useEffect(() => {
        // Gyroscope is only available on mobile devices
        if (Platform.OS === 'web') return;

        Gyroscope.setUpdateInterval(16); // 60fps

        const subscription = Gyroscope.addListener((data) => {
            // Map gyroscope data to rotation angles
            // Clamped to avoid extreme flipping
            // data.y controls X rotation (pitch)
            // data.x controls Y rotation (roll)

            // Smoothing factor could be added here if raw data is jittery, 
            // but for now direct mapping with spring in style is good.

            // Adjust sensitivity
            const sensitivity = 1.5;

            rotateX.value = withSpring(data.y * sensitivity, { damping: 20, stiffness: 100 });
            rotateY.value = withSpring(data.x * sensitivity, { damping: 20, stiffness: 100 });
        });

        return () => {
            subscription && subscription.remove();
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        // Limit rotation to +/- 15 degrees (~0.26 radians)
        const radX = interpolate(rotateX.value, [-5, 5], [15, -15], Extrapolate.CLAMP);
        const radY = interpolate(rotateY.value, [-5, 5], [-15, 15], Extrapolate.CLAMP);

        return {
            transform: [
                { perspective: 1000 },
                { rotateX: `${radX}deg` },
                { rotateY: `${radY}deg` },
            ],
        };
    });

    // Dynamic Shine Effect
    const shineStyle = useAnimatedStyle(() => {
        const translateX = interpolate(rotateY.value, [-2, 2], [-100, 100]);
        const translateY = interpolate(rotateX.value, [-2, 2], [-100, 100]);
        const opacity = interpolate(Math.abs(rotateX.value) + Math.abs(rotateY.value), [0, 2], [0, 0.4]);

        return {
            opacity: withSpring(opacity),
            transform: [
                { translateX: withSpring(translateX) },
                { translateY: withSpring(translateY) }
            ]
        };
    });

    return (
        <View style={[styles.container, style]}>
            <Animated.View style={[styles.cardContainer, animatedStyle]}>
                {children}

                {/* Glossy Shine Overlay */}
                <Animated.View style={[styles.shine, shineStyle]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        // zIndex is important for 3D context sometimes
        zIndex: 100
    },
    cardContainer: {
        // Needs to not clip for 3D effect to look best, but children usually have overflow hidden
        // We apply shadow here for depth
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 20,
        },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 15,
    },
    shine: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        borderRadius: 20, // Must match card radius
        overflow: 'hidden' // Clip gradient to card shape
    }
});

export default ThreeDCard;
