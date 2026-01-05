import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, Dimensions, Platform, Animated as RNAnimated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
// import MapView, { Marker } from 'react-native-maps'; // Disabled for Expo Go

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
import GlassCardComponent from '../../components/glass/GlassCard';
import PassCardComponent from '../../components/cards/PassCard';
import StopSelectionModal from '../../components/modals/StopSelectionModal';
import { Colors } from '../../constants/colors';
import { useBusLocation } from '../../features/location';
import ChangePasswordModal from '../../screens/auth/ChangePasswordModal';

const PassCard = React.memo(PassCardComponent);
const GlassCard = React.memo(GlassCardComponent);

const { width, height } = Dimensions.get('window');
// Match PassCard.js aspect ratio (1.3)
const CARD_HEIGHT = (width - 48) / 1.3;
// Calculate dynamic offsets
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 50 : 35;
const HIDDEN_OFFSET = -CARD_HEIGHT + 85;
// Reveal enough to show full card + some top padding.
const REVEALED_OFFSET = CARD_HEIGHT + STATUS_BAR_HEIGHT + 20;

const StudentDashboard = ({ onSignOut, onStartScanning }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [morningOptIn, setMorningOptIn] = useState(true);
    const [eveningOptIn, setEveningOptIn] = useState(true);

    // Stop Selection
    const [showStopModal, setShowStopModal] = useState(false);
    const [myStop, setMyStop] = useState('');

    // Bus Location - MUST be called before any early returns (Rules of Hooks)
    const { busLocation, isOnline } = useBusLocation(userData?.busId);

    // Entrance Animations
    const fadeAnim = React.useRef(new RNAnimated.Value(0)).current;
    const slideAnim = React.useRef(new RNAnimated.Value(30)).current;

    useEffect(() => {
        RNAnimated.parallel([
            RNAnimated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            }),
            RNAnimated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            })
        ]).start();
    }, []);

    // Animation Values
    const translateY = useSharedValue(HIDDEN_OFFSET);
    const context = useSharedValue({ y: 0 });

    const cardStyle = useAnimatedStyle(() => {
        // Add subtle scale effect: 0.95 when hidden -> 1.0 when revealed
        const scale = interpolate(
            translateY.value,
            [HIDDEN_OFFSET, REVEALED_OFFSET],
            [0.96, 1],
            Extrapolate.CLAMP
        );

        return {
            transform: [
                { translateY: translateY.value },
                { scale: scale }
            ],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateY.value,
            [HIDDEN_OFFSET, REVEALED_OFFSET],
            [0, 0.6], // Slightly darker backdrop
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
            // Add robust resistance
            let newValue = event.translationY + context.value.y;
            const MAX_DRAG = REVEALED_OFFSET + 80;
            if (newValue > MAX_DRAG) {
                // Logarithmic resistance
                const delta = newValue - MAX_DRAG;
                newValue = MAX_DRAG + (10 * Math.log(delta / 10 + 1));
            }
            translateY.value = newValue;
        })
        .onEnd((event) => {
            // Threshold based on velocity or position
            if (translateY.value > HIDDEN_OFFSET + 120 || event.velocityY > 500) {
                // Reveal - High damping for NO oscillation
                translateY.value = withSpring(REVEALED_OFFSET, {
                    damping: 20,
                    stiffness: 90,
                    mass: 0.6,
                    overshootClamping: true // CRITICAL: Prevents wiggle/overshoot
                });
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
            } else {
                // Hide with balanced snap
                translateY.value = withSpring(HIDDEN_OFFSET, {
                    damping: 24,
                    stiffness: 200,
                    overshootClamping: false
                });
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

    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            const data = doc.data();
            setUserData(data);
            setLoading(false);
            if (data?.requiresPasswordChange) {
                setShowPasswordModal(true);
            } else {
                setShowPasswordModal(false);
            }
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

    // AUTO-SCANNER TRIGGER (New Account / Reset Flow)
    // Triggers when: password change NOT required AND no bus linked
    useEffect(() => {
        if (!loading && userData && !userData.requiresPasswordChange && !userData.busId) {
            const timeout = setTimeout(() => {
                onStartScanning();
            }, 500); // 0.5s - fast transition
            return () => clearTimeout(timeout);
        }
    }, [userData, loading, onStartScanning]);

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

            // Widget update removed for Expo Go compatibility
            // if (Platform.OS === 'android' && SharedGroupPreferences) {
            //    ...
            // }
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
                            <Ionicons name="qr-code-outline" size={56} color="rgba(255,255,255,0.9)" />
                        </View>
                        <Text style={styles.nanoTitle}>NO PASS DETECTED</Text>
                        <Text style={styles.nanoSubtitle}>
                            Link your physical Baghirathi pass to enable digital access.
                        </Text>

                        <TouchableOpacity
                            style={styles.nanoButton}
                            onPress={onStartScanning}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="scan-outline" size={20} color="#111" />
                            <Text style={styles.nanoButtonText}>LINK PASS</Text>
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

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <RNAnimated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {/* Morning Card - Solid iOS Style */}
                            <View style={styles.solidCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                                        <Ionicons name="sunny" size={20} color="#fb923c" />
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
                                <Text style={styles.scheduleLabel}>Morning</Text>
                                <Text style={styles.scheduleTime}>07:30 AM</Text>
                                <Text style={[styles.scheduleTime, { opacity: 0.5, marginTop: 4 }]}>Bus {userData?.busId?.slice(0, 6) || '---'}</Text>
                            </View>

                            {/* Evening Card - Solid iOS Style */}
                            <View style={styles.solidCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <View style={[styles.iconBox, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
                                        <Ionicons name="moon" size={18} color="#c084fc" />
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
                                <Text style={styles.scheduleLabel}>Evening</Text>
                                <Text style={styles.scheduleTime}>03:45 PM</Text>
                                <Text style={[styles.scheduleTime, { opacity: 0.5, marginTop: 4 }]}>{myStop ? myStop.split(',')[0] : 'Campus'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Info Text - Solid iOS Style */}
                    <View style={styles.solidInfoBox}>
                        <Ionicons name="information-circle-outline" size={18} color="rgba(255,255,255,0.35)" />
                        <Text style={styles.infoText}>
                            Swiping your pass is not required. Just confirm your status above.
                        </Text>
                    </View>

                    <View style={{ height: 100 }} />
                </RNAnimated.View>
            </ScrollView>

            <StopSelectionModal
                visible={showStopModal}
                onSelect={handleSaveStop}
                initialStop={myStop}
            />

            <ChangePasswordModal
                visible={showPasswordModal}
                onSuccess={() => setShowPasswordModal(false)}
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
        zIndex: 100, // CRITICAL: Ensure card sits above everything
        elevation: 20,
        overflow: 'visible', // CRITICAL: Allow shadow without clipping
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
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    nanoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    nanoSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 22,
    },
    editCardBtn: {
        position: 'absolute',
        top: 25,
        right: 25,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 22, // Circle
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 50 // Ensure on top
    },
    nanoButton: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 36,
        borderRadius: 50,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
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
    scheduleGridCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        marginVertical: 0, // Override default GlassCard margin
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
    // iOS Solid Card Styles
    solidCard: {
        flex: 1,
        backgroundColor: '#1C1C1E', // iOS Dark Gray
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#3A3A3C', // iOS Dark Border
    },
    solidInfoBox: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
});

export default StudentDashboard;

