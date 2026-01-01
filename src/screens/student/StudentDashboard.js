import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import FluidButton from '../../components/buttons/FluidButton';
import { Colors } from '../../constants/colors';
import { BusMapView, useBusLocation } from '../../features/location';
import ChangePasswordModal from '../../screens/auth/ChangePasswordModal';

const StudentDashboard = ({ onStartScanning, onViewHistory, onSignOut, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [morningOptIn, setMorningOptIn] = useState(false);
    const [eveningOptIn, setEveningOptIn] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Hybrid bus location: live when available, estimated when offline
    const {
        location: busLocation,
        status: busStatus,
        isLive,
        nextStop,
        eta,
        isOperating,
        routePath
    } = useBusLocation();

    const todayStr = new Date().toISOString().split('T')[0];
    const APP_GROUP = 'WidgetPrefs';

    const updateWidget = async (morning, evening) => {
        if (Platform.OS !== 'android') return;
        try {
            const widgetData = { morning, evening };
            await SharedGroupPreferences.setItem('optin_data', JSON.stringify(widgetData), APP_GROUP);
        } catch (error) {
            console.log('Widget update error:', error);
        }
    };

    useEffect(() => {
        if (!auth.currentUser) return;

        // Listen to user profile
        const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserData(doc.data());
            setLoading(false);
        });

        // Listen to today's opt-in status
        const unsubOptIn = onSnapshot(doc(db, 'optins', `${auth.currentUser.uid}_${todayStr}`), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setMorningOptIn(data.morning || false);
                setEveningOptIn(data.evening || false);
                updateWidget(data.morning || false, data.evening || false);
            }
        });

        return () => {
            unsubUser();
            unsubOptIn();
        };
    }, []);

    const toggleOptIn = async (trip, value) => {
        try {
            const optInRef = doc(db, 'optins', `${auth.currentUser.uid}_${todayStr}`);
            const updateData = {
                userId: auth.currentUser.uid,
                userName: userData?.name || 'Student',
                date: todayStr,
                [trip]: value,
                updatedAt: new Date().toISOString(),
                busId: userData?.busId || 'unassigned',
                stopId: userData?.stopId || 'unassigned'
            };

            await setDoc(optInRef, updateData, { merge: true });

            // Basic optimization: we update widget with new state immediately
            // Note: In a real scenario, we should wait for Firestore, but for UI responsiveness we use local valid data
            const newMorning = trip === 'morning' ? value : morningOptIn;
            const newEvening = trip === 'evening' ? value : eveningOptIn;
            updateWidget(newMorning, newEvening);
        } catch (error) {
            console.error('Error updating opt-in:', error);
            Alert.alert('Error', 'Failed to update boarding status.');
        }
    };

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
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Header - Greeting */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={styles.greeting}>Hello,</Text>
                            <Text style={styles.userName}>{userData?.name || 'Student'}</Text>
                        </View>
                        <FluidButton
                            icon="log-out-outline"
                            onPress={onSignOut}
                            type="ghost"
                            size="small"
                        />
                    </View>
                    <Text style={styles.busInfo}>
                        {userData?.busId ? `Assigned to Bus: ${userData.busId}` : 'Not assigned to a bus yet'}
                    </Text>
                </View>

                {/* Bus Location Card */}
                {userData?.busId && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.mapHeader}
                            onPress={() => setShowMap(!showMap)}
                        >
                            <View style={styles.mapHeaderLeft}>
                                <Ionicons
                                    name={isOperating ? "location" : "location-outline"}
                                    size={20}
                                    color={isOperating ? (isLive ? Colors.success : Colors.accent) : Colors.textSecondary}
                                />
                                <Text style={styles.sectionTitle}>
                                    {isLive ? 'Bus is Live' : (isOperating ? 'Estimated Location' : 'Bus Location')}
                                </Text>
                                {isOperating && (
                                    <View style={[styles.liveBadge, !isLive && styles.estimatedBadge]}>
                                        <Text style={[styles.liveBadgeText, !isLive && styles.estimatedBadgeText]}>
                                            {isLive ? 'LIVE' : 'ESTIMATED'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Ionicons
                                name={showMap ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={Colors.textSecondary}
                            />
                        </TouchableOpacity>

                        {/* ETA Info Bar */}
                        {isOperating && nextStop && (
                            <View style={styles.etaBar}>
                                <View style={styles.etaInfo}>
                                    <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
                                    <Text style={styles.etaText}>Next: {nextStop.name}</Text>
                                </View>
                                {eta && (
                                    <Text style={styles.etaTime}>ETA: {eta}</Text>
                                )}
                            </View>
                        )}

                        {showMap && (
                            <GlassCard intensity={20} style={styles.mapCard}>
                                {busLocation ? (
                                    <BusMapView
                                        isDriver={false}
                                        otherBuses={[{
                                            id: 'driver',
                                            latitude: busLocation.latitude,
                                            longitude: busLocation.longitude
                                        }]}
                                        busRoute={{ coordinates: routePath }}
                                        style={styles.mapView}
                                    />
                                ) : (
                                    <View style={styles.mapOffline}>
                                        <Ionicons name="bus-outline" size={32} color={Colors.textSecondary} />
                                        <Text style={styles.mapOfflineText}>
                                            {isOperating ? 'Calculating route...' : 'Bus not operating now'}
                                        </Text>
                                    </View>
                                )}
                            </GlassCard>
                        )}
                    </View>
                )}

                {/* Daily Boarding Intent (Opt-In) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Boarding Status</Text>
                    <GlassCard intensity={30}>
                        <View style={styles.optInRow}>
                            <View style={styles.optInInfo}>
                                <Ionicons name="sunny-outline" size={24} color={Colors.accent} />
                                <View style={styles.optInTextContainer}>
                                    <Text style={styles.optInLabel}>Morning Trip</Text>
                                    <Text style={styles.optInSubtext}>To School / College</Text>
                                </View>
                            </View>
                            <Switch
                                value={morningOptIn}
                                onValueChange={(val) => {
                                    setMorningOptIn(val);
                                    toggleOptIn('morning', val);
                                }}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primaryLight }}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.optInRow}>
                            <View style={styles.optInInfo}>
                                <Ionicons name="moon-outline" size={24} color={Colors.primaryLight} />
                                <View style={styles.optInTextContainer}>
                                    <Text style={styles.optInLabel}>Evening Trip</Text>
                                    <Text style={styles.optInSubtext}>Heading Home</Text>
                                </View>
                            </View>
                            <Switch
                                value={eveningOptIn}
                                onValueChange={(val) => {
                                    setEveningOptIn(val);
                                    toggleOptIn('evening', val);
                                }}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primaryLight }}
                            />
                        </View>
                    </GlassCard>
                </View>

                {/* Main Actions */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionItem} onPress={onStartScanning}>
                        <GlassCard style={styles.actionCard} intensity={40}>
                            <View style={styles.actionContent}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
                                    <Ionicons name="scan-outline" size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.actionTitle}>Update Card</Text>
                                <Text style={styles.actionDesc}>Scan bus QR</Text>
                            </View>
                        </GlassCard>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={onViewHistory}>
                        <GlassCard style={styles.actionCard} intensity={25}>
                            <View style={styles.actionContent}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                    <Ionicons name="card-outline" size={32} color={Colors.success} />
                                </View>
                                <Text style={styles.actionTitle}>My Passes</Text>
                                <Text style={styles.actionDesc}>View history</Text>
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                </View>

                {/* Profile / Stats Summary (Optional) */}
                {!userData?.busId && (
                    <View style={styles.setupCard}>
                        <GlassCard intensity={80} style={{ padding: 20 }}>
                            <Ionicons name="information-circle-outline" size={32} color={Colors.primaryLight} />
                            <Text style={styles.setupTitle}>Initial Setup Required</Text>
                            <Text style={styles.setupDesc}>
                                Please scan the QR code located in your bus to link your account and generate your pass.
                            </Text>
                            <View style={{ marginTop: 24 }}>
                                <FluidButton
                                    title="Scan Bus QR Now"
                                    onPress={onStartScanning}
                                    type="primary"
                                    size="large"
                                    icon="scan"
                                />
                            </View>
                        </GlassCard>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
            {/* Password Change Modal */}
            <ChangePasswordModal
                visible={userData?.requiresPasswordChange === true}
                onSuccess={() => {
                    // Update local state is handled by onSnapshot, so modal will close automatically
                    // when Firestore updates.
                }}
            />
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
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
        fontSize: 20,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    userName: {
        fontSize: 40,
        color: Colors.text,
        fontWeight: '700',
        letterSpacing: -1,
    },
    signOutBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    busInfo: {
        fontSize: 16,
        color: Colors.primaryLight,
        marginTop: 8,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        color: Colors.text,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    optInRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optInInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    optInTextContainer: {
        justifyContent: 'center',
    },
    optInLabel: {
        fontSize: 18,
        color: Colors.text,
        fontWeight: '600',
    },
    optInSubtext: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    actionItem: {
        flex: 1,
    },
    actionCard: {
        height: 160,
        padding: 0,
    },
    actionContent: {
        padding: 16,
        height: '100%',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    actionTitle: {
        fontSize: 18,
        color: Colors.text,
        fontWeight: '700',
    },
    actionDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    setupCard: {
        marginTop: 12,
    },
    setupTitle: {
        fontSize: 20,
        color: Colors.text,
        fontWeight: '700',
        marginTop: 12,
    },
    setupDesc: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginTop: 8,
        lineHeight: 22,
    },
    setupButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    setupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    mapHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    liveBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.success,
        letterSpacing: 0.5,
    },
    mapCard: {
        padding: 0,
        overflow: 'hidden',
    },
    mapView: {
        height: 200,
        borderRadius: 16,
    },
    mapOffline: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    mapOfflineText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    estimatedBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    estimatedBadgeText: {
        color: Colors.accent,
    },
    etaBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 12,
    },
    etaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    etaText: {
        fontSize: 13,
        color: Colors.text,
    },
    etaTime: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
});

export default StudentDashboard;
