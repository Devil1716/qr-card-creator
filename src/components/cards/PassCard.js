import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH / 1.586; // Credit card aspect ratio

const PassCard = ({ userData }) => {
    return (
        <View style={styles.cardContainer}>
            {/* White Card Body */}
            <View style={styles.card}>

                {/* 1. Header: Logo */}
                <View style={styles.header}>
                    <View style={styles.logoRow}>
                        {/* Simulating the abstract logo with icons */}
                        <View style={styles.logoIcon}>
                            <Ionicons name="logo-rss" size={28} color="#eab308" style={{ position: 'absolute', left: -5, top: 0 }} />
                            <Ionicons name="wifi" size={28} color="#22c55e" style={{ transform: [{ rotate: '90deg' }] }} />
                        </View>
                        <View>
                            <Text style={styles.brandName}>Baghirathi</Text>
                            <Text style={styles.tagline}>Transforming Transportation</Text>
                        </View>
                    </View>
                </View>

                {/* 2. Main Content: QR Code */}
                <View style={styles.content}>
                    <View style={styles.qrBorder}>
                        <QRCode
                            value={userData?.id || 'NO_ID'}
                            size={140}
                            color="#000"
                            backgroundColor="#fff"
                        />
                    </View>

                    {/* ID Code below QR */}
                    <Text style={styles.idCode}>{userData?.id?.substring(0, 8).toUpperCase() || 'H7DJV9'}</Text>
                </View>

                {/* 3. Footer: Values */}
                <View style={styles.footer}>
                    <View style={styles.divider} />
                    <Text style={styles.footerText}>
                        RELIABLE  <Text style={styles.separator}>|</Text>  SECURE  <Text style={styles.separator}>|</Text>  COMFORTABLE
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        borderRadius: 16,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoIcon: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b', // Dark Slate
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 9,
        color: '#22c55e', // Green
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    content: {
        alignItems: 'center',
        gap: 8,
    },
    qrBorder: {
        padding: 4,
        backgroundColor: '#fff',
    },
    idCode: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 1,
    },
    separator: {
        color: '#cbd5e1',
        fontWeight: '300',
    }
});

export default PassCard;
