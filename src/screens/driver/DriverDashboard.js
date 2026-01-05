import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, FlatList, Switch, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import { useLocationEngine, LocationMode } from '../../features/location';
import RouteTimeline from './RouteTimeline';
import routePrediction from '../../features/location/services/RoutePrediction';
import ChangePasswordModal from '../../screens/auth/ChangePasswordModal';

const DriverDashboard = ({ onSignOut, navigation }) => {
    const [morningCount, setMorningCount] = useState(0);
    const [eveningCount, setEveningCount] = useState(0);
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [userData, setUserData] = useState(null);
    const [routeStatus, setRouteStatus] = useState(null);

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
            if (!userData?.busId) return; // Wait for busId

            try {
                const busRef = doc(db, 'bus_locations', auth.currentUser.uid);
                await updateDoc(busRef, {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: accuracy,
                    updatedAt: serverTimestamp(),
                    driverId: auth.currentUser.uid,
                    busId: userData.busId, // CRITICAL: Broadcast Bus ID
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
                            busId: userData.busId,
                            isActive: true
                        });
                    });
                });
            } catch (error) {
                console.error('Error broadcasting location:', error);
            }
        };

        const updateRouteStatus = () => {
            const status = routePrediction.getEstimatedPosition();
            setRouteStatus(status);
        };

        broadcastLocation();
        updateRouteStatus();
    }, [location, isSharing, accuracy, userData]);

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

    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const listAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            }),
            Animated.timing(listAnim, {
                toValue: 1,
                duration: 1000,
                delay: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            })
        ]).start();
    }, []);

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
            const data = doc.data();
            setUserData(data);
            if (data?.requiresPasswordChange) {
                setShowPasswordModal(true);
            }
        });

        return () => {
            unsubscribe();
            unsubUser();
        };
    }, []);

    // --- SMART ROUTE LOGIC ---
    const { activeStops, groupedBoarding, notBoarding, isMorningTrip } = useMemo(() => {
        const currentHour = new Date().getHours();
        const isMorning = currentHour < 12; // Morning trip logic
        const tripKey = isMorning ? 'morning' : 'evening';

        const notBoardingList = [];
        const boardingMap = {};

        passengers.forEach(p => {
            if (p[tripKey]) {
                // User is boarding
                const stopId = p.stopId || 'unknown';
                if (!boardingMap[stopId]) boardingMap[stopId] = [];
                boardingMap[stopId].push(p);
            } else {
                notBoardingList.push(p);
            }
        });

        // Filter stops: Only keep stops that have passengers boarding
        // AND always keep the 'next' stop if needed (optional, but strict filtering requested)
        const allStops = routePrediction.getStops();
        const filteredStops = allStops.filter(stop => {
            return boardingMap[stop.id] && boardingMap[stop.id].length > 0;
        });

        // If 'unknown' stops exist, maybe append a generic stop? ignoring for now.

        return {
            activeStops: filteredStops,
            groupedBoarding: boardingMap,
            notBoarding: notBoardingList,
            isMorningTrip: isMorning
        };
    }, [passengers]);

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
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={styles.greeting}>Driver</Text>
                            <Text style={styles.title}>Summary</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Settings')}
                                style={styles.settingsBtn}
                            >
                                <Ionicons name="settings-outline" size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onSignOut}
                                style={styles.settingsBtn}
                            >
                                <Ionicons name="log-out-outline" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.dateText}>{new Date().toDateString()}</Text>
                </Animated.View>

                {/* Counter Cards */}
                <Animated.View style={[styles.counterRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
                </Animated.View>

                {/* Location Sharing Toggle */}
                <Animated.View style={{ opacity: listAnim, transform: [{ translateY: slideAnim }] }}>
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

                    {/* Smart Route Timeline */}
                    <RouteTimeline
                        currentProgress={routeStatus?.progress || 0}
                        nextStopId={routeStatus?.nextStop?.id}
                        activeStops={activeStops}
                    />

                    <View style={styles.listSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={styles.sectionTitle}>
                                {isMorningTrip ? '☀️ Morning Pickup' : '🌙 Evening Drop'}
                            </Text>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                                    {passengers.length - notBoarding.length} Boarding
                                </Text>
                            </View>
                        </View>

                        {/* ACTIVE STOPS LIST */}
                        {activeStops.length > 0 ? (
                            activeStops.map((stop, index) => (
                                <View key={stop.id} style={{ marginBottom: 24 }}>
                                    {/* Stop Header */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4 }}>
                                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{index + 1}</Text>
                                        </View>
                                        <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>{stop.name}</Text>
                                        <Text style={{ color: Colors.textSecondary, fontSize: 13, marginLeft: 'auto' }}>
                                            {stop.morningTime}
                                        </Text>
                                    </View>

                                    {/* Passengers at this stop */}
                                    {groupedBoarding[stop.id]?.map(item => (
                                        <GlassCard key={item.id} intensity={15} style={styles.passengerCard}>
                                            <View style={styles.passengerRow}>
                                                <View style={styles.passengerInfo}>
                                                    <Text style={styles.passengerName}>{item.userName}</Text>
                                                </View>
                                                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                            </View>
                                        </GlassCard>
                                    ))}
                                </View>
                            ))
                        ) : (
                            <GlassCard style={{ marginBottom: 24 }}>
                                <View style={styles.emptyState}>
                                    <Ionicons name="bus-outline" size={48} color={Colors.textMuted} />
                                    <Text style={styles.emptyText}>No stops with boarding passengers.</Text>
                                </View>
                            </GlassCard>
                        )}

                        {/* NOT BOARDING SECTION */}
                        {notBoarding.length > 0 && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={[styles.sectionTitle, { color: Colors.error, fontSize: 14, marginBottom: 12 }]}>
                                    NOT BOARDING ({notBoarding.length})
                                </Text>
                                {notBoarding.map(item => (
                                    <GlassCard key={item.id} intensity={10} style={[styles.passengerCard, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                        <View style={styles.passengerRow}>
                                            <View style={styles.passengerInfo}>
                                                <Text style={[styles.passengerName, { color: 'rgba(255,255,255,0.6)' }]}>{item.userName}</Text>
                                            </View>
                                            <Ionicons name="close-circle" size={20} color={Colors.error} />
                                        </View>
                                    </GlassCard>
                                ))}
                            </View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>
            {/* Password Change Modal */}
            <ChangePasswordModal
                visible={showPasswordModal}
                onSuccess={() => setShowPasswordModal(false)}
            />
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
        paddingBottom: 120, // Add space for scrolling
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 16,
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
        minHeight: 140, // Prevent collapse
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
