import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import GlassCard from '../../../components/glass/GlassCard';
import { Colors } from '../../../constants/colors';

const STORAGE_KEY = '@location_sharing_enabled';

const DriverLocationToggle = ({ onSharingChange = null }) => {
    const [isSharing, setIsSharing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved preference
    useEffect(() => {
        loadSharingPreference();
    }, []);

    const loadSharingPreference = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved !== null) {
                setIsSharing(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading sharing preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSharing = async (value) => {
        setIsSharing(value);

        try {
            // Save locally
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));

            // Update Firestore
            if (auth.currentUser) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                    locationSharingEnabled: value,
                    locationSharingUpdatedAt: serverTimestamp()
                });
            }

            if (onSharingChange) {
                onSharingChange(value);
            }
        } catch (error) {
            console.error('Error updating sharing preference:', error);
            // Revert on error
            setIsSharing(!value);
        }
    };

    if (isLoading) return null;

    return (
        <GlassCard intensity={30} style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={isSharing ? "location" : "location-outline"}
                        size={24}
                        color={isSharing ? Colors.success : Colors.textSecondary}
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Share My Location</Text>
                    <Text style={styles.subtitle}>
                        {isSharing
                            ? 'Students can see your bus position'
                            : 'Location sharing is off'}
                    </Text>
                </View>
                <Switch
                    value={isSharing}
                    onValueChange={toggleSharing}
                    trackColor={{
                        false: 'rgba(255,255,255,0.1)',
                        true: Colors.successDark || '#16A34A'
                    }}
                    thumbColor={isSharing ? Colors.success : Colors.textSecondary}
                />
            </View>

            {isSharing && (
                <View style={styles.statusBar}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                    <Text style={styles.privacyNote}>
                        • Location updates every few seconds
                    </Text>
                </View>
            )}

            <View style={styles.privacyInfo}>
                <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.privacyText}>
                    Your exact location is only shared while this is enabled.
                    Turn off anytime to stop sharing.
                </Text>
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    textContainer: {
        flex: 1
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text
    },
    subtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)'
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        marginRight: 6
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.success,
        letterSpacing: 1,
        marginRight: 8
    },
    privacyNote: {
        fontSize: 12,
        color: Colors.textSecondary
    },
    privacyInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        gap: 8
    },
    privacyText: {
        flex: 1,
        fontSize: 11,
        color: Colors.textSecondary,
        lineHeight: 16
    }
});

export default DriverLocationToggle;
