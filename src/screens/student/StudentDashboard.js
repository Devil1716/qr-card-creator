import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
// Safe Import for Expo Go (where native module might be missing)
let SharedGroupPreferences;
try {
    SharedGroupPreferences = require('react-native-shared-group-preferences').default;
} catch (e) {
    console.log("SharedGroupPreferences module not found (Expo Go mode)");
}
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import PassCard from '../../components/cards/PassCard';
import StopSelectionModal from '../../components/modals/StopSelectionModal';
import { Colors } from '../../constants/colors';
import { useBusLocation } from '../../features/location';
import ChangePasswordModal from '../../screens/auth/ChangePasswordModal';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = (width - 48) / 1.586;
const HIDDEN_OFFSET = -CARD_HEIGHT + 80; // Show 80px hint
const REVEALED_OFFSET = 120; // Position when pulled down

const StudentDashboard = ({ onSignOut }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [morningOptIn, setMorningOptIn] = useState(true);
    const [eveningOptIn, setEveningOptIn] = useState(true);

    // Stop Selection
    const [showStopModal, setShowStopModal] = useState(false);
    const [myStop, setMyStop] = useState('');

    // Animation Values
    const translateY = useSharedValue(HIDDEN_OFFSET);
    const context = useSharedValue({ y: 0 });

    const cardStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateY.value,
            [HIDDEN_OFFSET, REVEALED_OFFSET],
            [0, 0.8],
            Extrapolate.CLAMP
        );
        return {
            opacity,
            zIndex: translateY.value > HIDDEN_OFFSET + 10 ? 90 : -1,
        };
    });

    // Gesture Handler
    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        })
        .onUpdate((event) => {
            translateY.value = event.translationY + context.value.y;
        })
        .onEnd(() => {
            if (translateY.value > HIDDEN_OFFSET + 100) {
                // Reveal
                translateY.value = withSpring(REVEALED_OFFSET, { damping: 15 });
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            } else {
                // Hide
                translateY.value = withSpring(HIDDEN_OFFSET, { damping: 15 });
            }
        });

    useEffect(() => {
        loadStopPreference();
    }, []);

    const loadStopPreference = async () => {
        try {
            const savedStop = await AsyncStorage.getItem('user_boarding_stop');
            if (!savedStop) {
                setShowStopModal(true);
            } else {
                setMyStop(savedStop);
            }
        } catch (e) {
            console.log('Error loading stop:', e);
        }
    };

    const handleSaveStop = async (stop) => {
        try {
            await AsyncStorage.setItem('user_boarding_stop', stop);
            setMyStop(stop);
            setShowStopModal(false);
            Alert.alert('Stop Saved', `Your stop "${stop}" has been saved.`);
        } catch (e) {
            Alert.alert('Error', 'Failed to save stop.');
        }
    };

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            setUserData(doc.data());
            setLoading(false);
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const unsubOptIn = onSnapshot(doc(db, 'optins', `${auth.currentUser.uid}_${todayStr}`), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setMorningOptIn(data.morning ?? true);
                setEveningOptIn(data.evening ?? true);
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
            const todayStr = new Date().toISOString().split('T')[0];
            const optInRef = doc(db, 'optins', `${auth.currentUser.uid}_${todayStr}`);
            await setDoc(optInRef, {
                userId: auth.currentUser.uid,
                userName: userData?.name || 'Student',
                date: todayStr,
                [trip]: value,
                updatedAt: new Date().toISOString(),
                busId: userData?.busId || 'unassigned',
                stopId: myStop || userData?.stopId || 'unassigned' // Use saved stop
            }, { merge: true });

            if (Platform.OS === 'android' && SharedGroupPreferences) {
                try {
                    await SharedGroupPreferences.setItem('optin_data', JSON.stringify({
                        morning: trip === 'morning' ? value : morningOptIn,
                        evening: trip === 'evening' ? value : eveningOptIn
                    }), 'WidgetPrefs');
                } catch (e) {
                    console.log("Widget update failed (or not supported)");
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update boarding status.');
        }
    };

    const handleUnlink = async () => {
        Alert.alert(
            "Unlink Pass",
            "Are you sure you want to remove this pass? You will need to scan your code again.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unlink",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const userRef = doc(db, 'users', auth.currentUser.uid);
                            await updateDoc(userRef, {
                                busId: null,
                                stopId: null
                            });
                            // Also clear local stop preference
                            await AsyncStorage.removeItem('user_boarding_stop');
                            setMyStop('');
                            setUserData(prev => ({ ...prev, busId: null }));
                            Alert.alert("Pass Unlinked", "Please scan your QR code to link again.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to unlink pass.");
                        }
                    }
                }
            ]
        );
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

    // --- CASE 1: NO PASS LINKED (NANO BANANA EMPTY STATE) ---
    if (!userData?.busId) {
        return (
            <GlassBackground>
                <ScrollView contentContainerStyle={styles.emptyStateContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>WELCOME</Text>
                            <Text style={styles.userName}>{userData?.name?.split(' ')[0] || 'Student'}</Text>
                        </View>
                        <TouchableOpacity onPress={onSignOut} style={styles.settingsBtn}>
                            <Ionicons name="log-out-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.nanoContainer}>
                        <View style={styles.nanoIconRing}>
                            <Ionicons name="qr-code-outline" size={64} color="#FACC15" />
                        </View>
                        <Text style={styles.nanoTitle}>NO PASS DETECTED</Text>
                        <Text style={styles.nanoSubtitle}>
                            Link your physical Baghirathi pass to enable digital access.
                        </Text>

                        <TouchableOpacity
                            style={styles.nanoButton}
                            onPress={onStartScanning}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.nanoButtonText}>LINK PASS</Text>
                            <Ionicons name="arrow-forward" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </GlassBackground>
        );
    }

    // --- CASE 2: PASS LINKED (DASHBOARD) ---
    return (
        <GlassBackground>
            {/* Backdrop for Card */}
            <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />

            {/* Inverted Card Container (GESTURE ENABLED) */}
            <View style={{ zIndex: 100 }}>
                <GestureDetector gesture={gesture}>
                    <Animated.View style={[styles.cardContainer, cardStyle]}>
                        <PassCard userData={userData} />

                        {/* Pull Handle */}
                        <View style={styles.pullHandleContainer}>
                            <View style={styles.pullHandle} />
                            <Text style={styles.pullText}>Pull for Pass</Text>
                            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.5)" />
                        </View>
                    </Animated.View>
                </GestureDetector>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Live Update Active! ⚡</Text>
                        <Text style={styles.userName}>{userData?.name?.split(' ')[0] || 'Student'}</Text>
                        <TouchableOpacity onPress={() => setShowStopModal(true)}>
                            <Text style={styles.currentStop}>
                                <Ionicons name="location" size={12} /> {myStop || 'Select Stop'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {/* Unlink Button */}
                        <TouchableOpacity onPress={handleUnlink} style={styles.settingsBtn}>
                            <Ionicons name="unlink-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onSignOut} style={styles.settingsBtn}>
                            <Ionicons name="log-out-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Boarding Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>

                    {/* Morning Card */}
                    <GlassCard style={styles.scheduleCard} intensity={25}>
                        <View style={styles.scheduleRow}>
                            <View style={styles.scheduleInfo}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 146, 60, 0.2)' }]}>
                                    <Ionicons name="sunny" size={20} color="#fb923c" />
                                </View>
                                <View>
                                    <Text style={styles.scheduleLabel}>Morning Pickup</Text>
                                    <Text style={styles.scheduleTime}>07:30 AM • Bus {userData?.busId || '---'}</Text>
                                </View>
                            </View>
                            <Switch
                                value={morningOptIn}
                                onValueChange={(val) => {
                                    setMorningOptIn(val);
                                    toggleOptIn('morning', val);
                                }}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.success }}
                                thumbColor={'#fff'}
                            />
                        </View>
                    </GlassCard>

                    {/* Evening Card */}
                    <GlassCard style={[styles.scheduleCard, { marginTop: 12 }]} intensity={25}>
                        <View style={styles.scheduleRow}>
                            <View style={styles.scheduleInfo}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(147, 51, 234, 0.2)' }]}>
                                    <Ionicons name="moon" size={18} color="#c084fc" />
                                </View>
                                <View>
                                    <Text style={styles.scheduleLabel}>Evening Drop-off</Text>
                                    <Text style={styles.scheduleTime}>03:45 PM • {myStop || 'Campus'}</Text>
                                </View>
                            </View>
                            <Switch
                                value={eveningOptIn}
                                onValueChange={(val) => {
                                    setEveningOptIn(val);
                                    toggleOptIn('evening', val);
                                }}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.success }}
                                thumbColor={'#fff'}
                            />
                        </View>
                    </GlassCard>
                </View>

                {/* Info Text */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.infoText}>
                        Swiping your pass is not required. Just confirm your status above.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <StopSelectionModal
                visible={showStopModal}
                onSelect={handleSaveStop}
                initialStop={myStop}
            />

            <ChangePasswordModal
                visible={userData?.requiresPasswordChange === true}
                onSuccess={() => { }}
            />
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    cardContainer: {
        position: 'absolute',
        top: 0,
        left: 24,
        right: 24,
        alignItems: 'center',
        paddingBottom: 20,
    },
    pullHandleContainer: {
        alignItems: 'center',
        marginTop: 10,
        gap: 4,
    },
    pullHandle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    pullText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    scrollContainer: {
        padding: 24,
        paddingTop: 140, // Space for the card hint
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    optInLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
        flex: 1,
        marginLeft: 8,
    },
    // NANO BANANA STYLES
    emptyStateContainer: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 60,
    },
    nanoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
        gap: 20,
    },
    nanoIconRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(250, 204, 21, 0.1)', // Yellow/10
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    nanoTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    nanoSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 22,
    },
    nanoButton: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FACC15',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 12,
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    nanoButtonText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    currentStop: {
        fontSize: 12,
        color: Colors.accent,
        fontWeight: '600',
    },
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 16,
        letterSpacing: 1,
    },
    scheduleCard: {
        padding: 16,
        borderRadius: 20,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleLabel: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 2,
    },
    scheduleTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 18,
    },
});

export default StudentDashboard;

