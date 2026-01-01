import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

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
    // Organic Harmony Glow Effects
    glowTop: {
        position: 'absolute',
        top: -150,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: Colors.primary, // Electric Violet
        opacity: 0.12,
        transform: [{ scaleX: 1.5 }, { scaleY: 1.2 }],
    },
    glowBottom: {
        position: 'absolute',
        bottom: -150,
        right: -80,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: Colors.accent, // Amber
        opacity: 0.08,
        transform: [{ scale: 1.4 }],
    },
});

export default GlassBackground;
