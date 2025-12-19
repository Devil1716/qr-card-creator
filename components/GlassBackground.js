import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

const GlassBackground = ({ children, style }) => {
    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={Colors.gradients.background}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.glowTop} />
                <View style={styles.glowBottom} />
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
    },
    content: {
        flex: 1,
        zIndex: 2,
    },
    // Celestial Glow Effects
    glowTop: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.primary,
        opacity: 0.15,
        transform: [{ scale: 1.5 }],
    },
    glowBottom: {
        position: 'absolute',
        bottom: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.secondary,
        opacity: 0.1,
        transform: [{ scale: 1.5 }],
    },
});

export default GlassBackground;
