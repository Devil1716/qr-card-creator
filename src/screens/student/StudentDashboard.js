import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Switch, ActivityIndicator, Alert, Platform, Easing, LayoutAnimation, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import PassCard from '../../components/cards/PassCard';
import FluidButton from '../../components/buttons/FluidButton';
import { Colors } from '../../constants/colors';
import { BusMapView, useBusLocation } from '../../features/location';
import ChangePasswordModal from '../../screens/auth/ChangePasswordModal';

const StudentDashboard = ({ onStartScanning, onViewHistory, onSignOut, navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [morningOptIn, setMorningOptIn] = useState(true);
    const [eveningOptIn, setEveningOptIn] = useState(true);
    const [isMapExpanded, setIsMapExpanded] = useState(false);

    // Swipe-to-Reveal Logic
    const [isCardRevealed, setIsCardRevealed] = useState(false);
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const pan = useRef(new Animated.ValueXY()).current;
    const { height } = Dimensions.get('window');

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only enable if pulling down, not revealed, and roughly vertical
                return !isCardRevealed && gestureState.dy > 10 && Math.abs(gestureState.dx) < 20;
            },
            onPanResponderGrant: () => {
                setScrollEnabled(false);
            },
            onPanResponderMove: Animated.event(
                [null, { dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gestureState) => {
                setScrollEnabled(true);
                if (gestureState.dy > 120) { // Threshold to reveal
                    setIsCardRevealed(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Animated.spring(pan, {
                        toValue: { x: 0, y: height * 0.25 }, // Center roughly
                        useNativeDriver: true,
                        tension: 50,
                        friction: 7
                    }).start();
                } else {
                    // Reset
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true
                    }).start();
                }
            }
        })
    ).current;

    const dismissCard = () => {
        setIsCardRevealed(false);
        Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true
        }).start();
    };

    // Hybrid bus location logic
    const {
        location: busLocation,
        status: busStatus,
        isLive,
        nextStop,
        eta,
        isOperating,
        routePath
    } = useBusLocation();

    // Pulse Animation for Live Badge
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isLive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.6,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    })
                ])
            ).start();
        }
    }, [isLive]);

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
                setMorningOptIn(data.morning !== undefined ? data.morning : true);
                setEveningOptIn(data.evening !== undefined ? data.evening : true);
                updateWidget(
                    data.morning !== undefined ? data.morning : true,
                    data.evening !== undefined ? data.evening : true
                );
            }
        });

        return () => {
            unsubUser();
            unsubOptIn();
        };
    }, []);

    const toggleOptIn = async (trip, value) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

            const newMorning = trip === 'morning' ? value : morningOptIn;
            const newEvening = trip === 'evening' ? value : eveningOptIn;
            updateWidget(newMorning, newEvening);
        } catch (error) {
            console.error('Error updating opt-in:', error);
            Alert.alert('Error', 'Failed to update boarding status.');
        }
    };

    const toggleMap = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsMapExpanded(!isMapExpanded);
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
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                scrollEnabled={scrollEnabled}
            >

                {/* 1. Header - Modern & Minimal */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {userData?.name ? userData.name.charAt(0).toUpperCase() : 'S'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.greeting}>Hello,</Text>
                            <Text style={styles.userName}>{userData?.name?.split(' ')[0] || 'Student'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onSignOut} style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* 2. Hero Card Section */}
                <View style={[styles.heroSection, { zIndex: 100 }]}>
                    {/* Backdrop Overlay when revealed */}
                    {isCardRevealed && (
                        <TouchableOpacity
                            style={styles.backdrop}
                            activeOpacity={1}
                            onPress={dismissCard}
                        >
                            <View style={styles.backdropBlur} />
                        </TouchableOpacity>
                    )}

                    <Animated.View
                        style={{
                            transform: [{ translateY: pan.y }, { scale: isCardRevealed ? 1.1 : 1 }],
                            zIndex: 101
                        }}
                        {...panResponder.panHandlers}
                    >
                        <PassCard
                            userData={userData}
                            flipped={isCardRevealed}
                            onFlip={(flipped) => {
                                // Manual flip logic if needed, but we mostly control via reveal state
                                if (!isCardRevealed && flipped) {
                                    // If user taps to flip while not revealed, maybe trigger reveal?
                                    // For now, let's keep it simple: manual flip only works if allowed
                                }
                            }}
                        />
                    </Animated.View>

                    {/* Status Pill below card */}
                    <Animated.View style={[styles.statusPill, { opacity: isCardRevealed ? 0 : 1 }]}>
                        <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                        <Text style={styles.statusText}>Active • Expires Dec 2026</Text>
                    </Animated.View>
                </View>

                {/* 3. Live Bus Status (Compact ETA Pill) */}
                {userData?.busId && (
                    <TouchableOpacity
                        style={styles.etaContainer}
                        activeOpacity={0.9}
                        onPress={toggleMap}
                    >
                        <GlassCard intensity={40} style={styles.etaCard}>
                            <View style={styles.etaHeader}>
                                <View style={styles.etaLeft}>
                                    <View style={[styles.iconBox, { backgroundColor: isLive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)' }]}>
                                        <Ionicons name="bus" size={20} color={isLive ? Colors.success : '#fff'} />
                                    </View>
                                    <View>
                                        <Text style={styles.etaTitle}>
                                            {isOperating ? (nextStop ? `Next: ${nextStop.name}` : 'En Route') : 'Bus Not Operating'}
                                        </Text>
                                        <Text style={styles.etaSubtitle}>
                                            {isOperating ? (eta ? `Arriving in ${eta}` : 'Calculating ETA...') : 'Schedule: 7:00 AM - 9:00 PM'}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name={isMapExpanded ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.5)" />
                            </View>

                            {/* Expanded Map View */}
                            {isMapExpanded && (
                                <View style={styles.mapContainer}>
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
                                            <Ionicons name="cloud-offline-outline" size={24} color={Colors.textSecondary} />
                                            <Text style={styles.mapOfflineText}>Live location unavailable</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </GlassCard>
                    </TouchableOpacity>
                )}

                {/* 4. Quick Actions Grid */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionBtn} onPress={onStartScanning}>
                        <GlassCard style={styles.actionBtnCard} intensity={25}>
                            <Ionicons name="scan" size={24} color={Colors.primary} />
                            <Text style={styles.actionBtnText}>Scan QR</Text>
                        </GlassCard>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onViewHistory}>
                        <GlassCard style={styles.actionBtnCard} intensity={25}>
                            <Ionicons name="time-outline" size={24} color={Colors.accent} />
                            <Text style={styles.actionBtnText}>History</Text>
                        </GlassCard>
                    </TouchableOpacity>
                </View>

                {/* 5. Boarding Opt-In (Compact Toggles) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Boarding</Text>
                    <View style={styles.optInGrid}>
                        {/* Morning Toggle */}
                        <GlassCard style={styles.optInPill} intensity={20}>
                            <View style={styles.optInContent}>
                                <Ionicons name="sunny" size={20} color={morningOptIn ? Colors.accent : 'rgba(255,255,255,0.3)'} />
                                <Text style={[styles.optInLabel, morningOptIn && { color: '#fff', fontWeight: 'bold' }]}>Morning</Text>
                                <Switch
                                    value={morningOptIn}
                                    onValueChange={(val) => {
                                        setMorningOptIn(val);
                                        toggleOptIn('morning', val);
                                    }}
                                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.success }}
                                    thumbColor={'#fff'}
                                    style={{ transform: [{ scale: 0.8 }] }}
                                />
                            </View>
                        </GlassCard>

                        {/* Evening Toggle */}
                        <GlassCard style={styles.optInPill} intensity={20}>
                            <View style={styles.optInContent}>
                                <Ionicons name="moon" size={18} color={eveningOptIn ? Colors.primaryLight : 'rgba(255,255,255,0.3)'} />
                                <Text style={[styles.optInLabel, eveningOptIn && { color: '#fff', fontWeight: 'bold' }]}>Evening</Text>
                                <Switch
                                    value={eveningOptIn}
                                    onValueChange={(val) => {
                                        setEveningOptIn(val);
                                        toggleOptIn('evening', val);
                                    }}
                                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.success }}
                                    thumbColor={'#fff'}
                                    style={{ transform: [{ scale: 0.8 }] }}
                                />
                            </View>
                        </GlassCard>
                    </View>
                </View>

                {/* Setup Prompt (if needed) */}
                {!userData?.busId && (
                    <View style={{ marginTop: 20 }}>
                        <FluidButton
                            title="Link Your Bus"
                            onPress={onStartScanning}
                            type="primary"
                            icon="link"
                        />
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <ChangePasswordModal
                visible={userData?.requiresPasswordChange === true}
                onSuccess={() => { }}
            />
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    greeting: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
    },
    userName: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '700',
    },
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: -1000,
        left: -500,
        right: -500,
        bottom: -1000,
        zIndex: 90,
    },
    backdropBlur: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    // Hero Section
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    statusPill: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    // ETA Bar
    etaContainer: {
        marginBottom: 24,
    },
    etaCard: {
        padding: 0,
        borderRadius: 16,
    },
    etaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    etaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    etaTitle: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '700',
    },
    etaSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    mapContainer: {
        height: 200,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    mapView: {
        flex: 1,
    },
    mapOffline: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    mapOfflineText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    // Actions Grid
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    actionBtn: {
        flex: 1,
    },
    actionBtnCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        height: 60,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    // Section
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    optInGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    optInPill: {
        flex: 1,
        padding: 0,
    },
    optInContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    optInLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
        flex: 1,
        marginLeft: 8,
    },
});

export default StudentDashboard;

