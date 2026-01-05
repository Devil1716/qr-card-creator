import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = CARD_WIDTH / 1.3;

const PassCard = ({ userData }) => {
    return (
        <View style={styles.cardContainer}>
            {/* Prism Border Effect */}
            <LinearGradient
                colors={['rgba(0, 255, 255, 0.5)', 'rgba(255, 0, 255, 0.4)', 'rgba(255, 255, 0, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.prismBorder}
            >
                {/* White Card Body */}
                <View style={styles.card}>

                    {/* 1. Header: Logo */}
                    <View style={styles.header}>
                        <View style={styles.logoRow}>
                            <View style={styles.logoIcon}>
                                <Ionicons name="logo-rss" size={24} color="#eab308" style={{ position: 'absolute', left: -5, top: 0 }} />
                                <Ionicons name="wifi" size={24} color="#22c55e" style={{ transform: [{ rotate: '90deg' }] }} />
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
                                value={userData?.busId ? String(userData.busId) : 'NO_PASS'}
                                size={125}
                                color="#000"
                                backgroundColor="#fff"
                                quietZone={4}
                                onError={(e) => console.log('QR Error:', e)}
                            />
                        </View>
                        <Text style={styles.idCode}>{userData?.busId?.substring(0, 8).toUpperCase() || 'SCAN ME'}</Text>
                    </View>

                    {/* 3. Footer: Values */}
                    <View style={styles.footer}>
                        <View style={styles.divider} />
                        <Text style={styles.footerText}>
                            RELIABLE  <Text style={styles.separator}>|</Text>  SECURE  <Text style={styles.separator}>|</Text>  COMFORTABLE
                        </Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        shadowColor: 'rgba(0, 243, 255, 0.4)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
        borderRadius: 20,
    },
    prismBorder: {
        flex: 1,
        borderRadius: 20,
        padding: 2, // Thick prismatic border
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 8,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoIcon: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 8,
        color: '#22c55e',
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    content: {
        alignItems: 'center',
        gap: 4,
    },
    qrBorder: {
        padding: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
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
        backgroundColor: '#e2e8f0',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 1,
    },
    separator: {
        color: '#94a3b8',
        fontWeight: '300',
    }
});

export default PassCard;
