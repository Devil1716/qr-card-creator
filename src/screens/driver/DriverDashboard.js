import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, FlatList, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import { useLocationEngine, LocationMode } from '../../features/location';
import RouteTimeline from './RouteTimeline';
import ChangePasswordModal from '../../screens/auth/ChangePasswordModal';

const DriverDashboard = ({ onSignOut, navigation }) => {
    const [morningCount, setMorningCount] = useState(0);
    const [eveningCount, setEveningCount] = useState(0);
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [userData, setUserData] = useState(null);

    const todayStr = new Date().toISOString().split('T')[0];

    // Location engine for broadcasting
    const { location, accuracy, startTracking, stopTracking, isTracking } = useLocationEngine({
        mode: isSharing ? LocationMode.ACTIVE : LocationMode.OFF,
        enableSensorFusion: true
    });

    // Broadcast location to Firestore when tracking
    useEffect(() => {
        if (!isSharing || !location || !auth.currentUser) return;

        const broadcastLocation = async () => {
            try {
                const busRef = doc(db, 'bus_locations', auth.currentUser.uid);
                await updateDoc(busRef, {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: accuracy,
                    updatedAt: serverTimestamp(),
                    driverId: auth.currentUser.uid,
                    isActive: true
                }).catch(() => {
                    // Document may not exist, create it
                    import('firebase/firestore').then(({ setDoc }) => {
                        setDoc(busRef, {
                            latitude: location.latitude,
                            longitude: location.longitude,
                            accuracy: accuracy,
                            updatedAt: serverTimestamp(),
                            driverId: auth.currentUser.uid,
                            isActive: true
                        });
                    });
                });
            } catch (error) {
                console.error('Error broadcasting location:', error);
            }
        };

        broadcastLocation();
    }, [location, isSharing, accuracy]);

    // Toggle location sharing
    const toggleSharing = useCallback((value) => {
        setIsSharing(value);
        if (value) {
            startTracking();
        } else {
            stopTracking();
            // Mark as inactive
            if (auth.currentUser) {
                const busRef = doc(db, 'bus_locations', auth.currentUser.uid);
                updateDoc(busRef, { isActive: false }).catch(() => { });
            }
        }
    }, [startTracking, stopTracking]);

    useEffect(() => {
        // Query today's opt-ins
        const q = query(collection(db, 'optins'), where('date', '==', todayStr));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let mCount = 0;
            let eCount = 0;
            const passList = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.morning) mCount++;
                if (data.evening) eCount++;
                passList.push({ id: doc.id, ...data });
            });

            setMorningCount(mCount);
            setEveningCount(eCount);
            setPassengers(passList);
            setLoading(false);
        });



        // Also listen to own user profile for password flag
        const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserData(doc.data());
        });

        return () => {
            unsubscribe();
            unsubUser();
        };
    }, []);

    if (loading) {
        return (
            <GlassBackground>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </GlassBackground>
        );
    }

    return (
        <GlassBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={styles.greeting}>Driver</Text>
                            <Text style={styles.title}>Summary</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Settings')}
                            style={styles.settingsBtn}
                        >
                            <Ionicons name="settings-outline" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.dateText}>{new Date().toDateString()}</Text>
                </View>

                {/* Counter Cards */}
                <View style={styles.counterRow}>
                    <GlassCard style={styles.counterCard} intensity={40}>
                        <Ionicons name="sunny" size={32} color={Colors.accent} />
                        <Text style={styles.countNumber}>{morningCount}</Text>
                        <Text style={styles.countLabel}>Morning</Text>
                    </GlassCard>

                    <GlassCard style={styles.counterCard} intensity={25}>
                        <Ionicons name="moon" size={32} color={Colors.primaryLight} />
                        <Text style={styles.countNumber}>{eveningCount}</Text>
                        <Text style={styles.countLabel}>Evening</Text>
                    </GlassCard>
                </View>

                {/* Location Sharing Toggle */}
                <GlassCard intensity={30} style={styles.locationCard}>
                    <View style={styles.locationRow}>
                        <View style={styles.locationInfo}>
                            <Ionicons
                                name={isSharing ? "location" : "location-outline"}
                                size={24}
                                color={isSharing ? Colors.success : Colors.textSecondary}
                            />
                            <View style={styles.locationText}>
                                <Text style={styles.locationTitle}>Share Bus Location</Text>
                                <Text style={styles.locationSubtext}>
                                    {isSharing
                                        ? `Broadcasting • ±${accuracy?.toFixed(0) || '--'}m`
                                        : 'Students cannot see your bus'}
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isSharing}
                            onValueChange={toggleSharing}
                            trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.successDark || '#16A34A' }}
                            thumbColor={isSharing ? Colors.success : Colors.textSecondary}
                        />
                    </View>
                    {isSharing && (
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    )}
                </GlassCard>

                {/* Route Timeline (Driver Only) */}
                <RouteTimeline />

                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>Boarding List</Text>
                    {passengers.length > 0 ? (
                        <FlatList
                            data={passengers}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <GlassCard intensity={15} style={styles.passengerCard}>
                                    <View style={styles.passengerRow}>
                                        <View style={styles.passengerInfo}>
                                            <Text style={styles.passengerName}>{item.userName}</Text>
                                            <Text style={styles.passengerSubtext}>Stop: {item.stopId || 'Unassigned'}</Text>
                                        </View>
                                        <View style={styles.indicatorContainer}>
                                            {item.morning && <Ionicons name="sunny" size={16} color={Colors.accent} />}
                                            {item.evening && <Ionicons name="moon" size={16} color={Colors.primaryLight} style={{ marginLeft: 8 }} />}
                                        </View>
                                    </View>
                                </GlassCard>
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        />
                    ) : (
                        <GlassCard>
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
                                <Text style={styles.emptyText}>No passengers opted in yet.</Text>
                            </View>
                        </GlassCard>
                    )}
                </View>
            </View>
            {/* Password Change Modal */}
            <ChangePasswordModal
                visible={userData?.requiresPasswordChange === true}
                onSuccess={() => { }}
            />
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 32,
    },
    greeting: {
        fontSize: 18,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    title: {
        fontSize: 36,
        color: Colors.text,
        fontWeight: '700',
        letterSpacing: -1,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    counterRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    counterCard: {
        flex: 1,
        alignItems: 'center',
        padding: 24,
    },
    countNumber: {
        fontSize: 32,
        color: Colors.text,
        fontWeight: '800',
        marginVertical: 4,
    },
    countLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    listSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        color: Colors.text,
        fontWeight: '600',
        marginBottom: 16,
    },
    passengerCard: {
        padding: 16,
        marginVertical: 6,
    },
    passengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    passengerName: {
        fontSize: 17,
        color: Colors.text,
        fontWeight: '600',
    },
    passengerSubtext: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 2,
    },
    indicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    locationCard: {
        marginBottom: 24,
        padding: 16,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    locationText: {
        flex: 1,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    locationSubtext: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.success,
        letterSpacing: 1,
    }
});

export default DriverDashboard;
