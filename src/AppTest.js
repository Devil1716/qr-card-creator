import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function AppTest() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Debug Mode</Text>
                <Text style={styles.text}>If you can see this, the App environment is healthy!</Text>
                <Text style={styles.subtext}>The issue is in the main App.js imports.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        padding: 24,
        backgroundColor: '#222',
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    title: {
        color: '#4ade80', // green-400
        fontSize: 24,
        fontWeight: 'bold',
    },
    text: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    subtext: {
        color: '#888',
        fontSize: 14,
    }
});
