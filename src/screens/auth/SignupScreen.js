import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated, Dimensions, Easing, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import routePrediction from '../../features/location/services/RoutePrediction'; // Import route service
import FluidButton from '../../components/buttons/FluidButton';

const { width } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [role] = useState('student'); // Default to student, driver creation removed
    const [selectedStop, setSelectedStop] = useState(null); // { id, name }
    const [showStopModal, setShowStopModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Get stops for selection
    const stops = useMemo(() => routePrediction.getStops(), []);

    // Animations - run only once
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const hasAnimated = useRef(false);

    // Memoize credentials to prevent re-renders
    const generatedCredentials = useMemo(() => {
        const cleanName = name.trim().replace(/\s+/g, '').toLowerCase();
        const base = cleanName.length > 0 ? cleanName : 'user';
        const email = `${base}@r8.bus`;
        const password = email; // Initial password is the email itself
        return { email, password };
    }, [name]);

    React.useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();
    }, []);

    const handleSignup = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name.');
            return;
        }

        setIsLoading(true);
        Keyboard.dismiss();

        try {
            const { email, password } = generatedCredentials;

            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Display Name
            await updateProfile(user, { displayName: name });

            // 3. Create User Profile in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: role,
                createdAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                busId: role === 'student' ? 'KA-01-F-1234' : null, // Auto-assign to default bus for now
                stopId: selectedStop?.id || null,
                stopName: selectedStop?.name || null,
                requiresPasswordChange: true // Force password change on first login
            });

            // Should automatically navigate via Auth Stack listener
        } catch (error) {
            console.error('Signup error:', error);
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Signup Failed', 'This name is already taken. Please use a specific identifier (e.g., JohnDoe2).');
            } else {
                Alert.alert('Signup Failed', error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassBackground>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Join R8</Text>
                            <Text style={styles.subtitle}>Enter your name to begin.</Text>
                        </View>

                        <GlassCard style={styles.card}>
                            <View style={styles.form}>

                                {/* Stop Selection (Always visible for students) */}
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>YOUR STOP</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowStopModal(true)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="location" size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                                            <Text style={[styles.inputText, !selectedStop && styles.placeholderText]}>
                                                {selectedStop ? selectedStop.name : 'Select your pickup stop'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.4)" />
                                    </TouchableOpacity>
                                </View>

                                {/* Name Input */}
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>FULL NAME</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. Rahul Sharma"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            returnKeyType="done"
                                            onSubmitEditing={handleSignup}
                                        />
                                    </View>
                                </View>

                                {/* Auto-Gen Info */}
                                {name.length > 0 && (
                                    <View style={styles.autoGenInfo}>
                                        <Ionicons name="sparkles" size={14} color={Colors.secondary} />
                                        <Text style={styles.autoGenText}>
                                            ID will be: <Text style={styles.highlight}>{generatedCredentials.email}</Text>
                                        </Text>
                                    </View>
                                )}

                                {/* Signup Button */}
                                <View style={{ marginTop: 10 }}>
                                    <FluidButton
                                        title="Create Account"
                                        onPress={handleSignup}
                                        isLoading={isLoading}
                                        type="secondary" // Green theme
                                        size="large"
                                        icon="person-add"
                                    />
                                </View>
                            </View>
                        </GlassCard>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an ID? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Stop Selection Modal */}
            {showStopModal && (
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent} intensity={40}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Your Stop</Text>
                            <TouchableOpacity onPress={() => setShowStopModal(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.stopList} showsVerticalScrollIndicator={false}>
                            {stops.map((stop) => (
                                <TouchableOpacity
                                    key={stop.id}
                                    style={[
                                        styles.stopItem,
                                        selectedStop?.id === stop.id && styles.stopItemActive
                                    ]}
                                    onPress={() => {
                                        setSelectedStop(stop);
                                        setShowStopModal(false);
                                    }}
                                >
                                    <View style={styles.stopInfo}>
                                        <Ionicons
                                            name={selectedStop?.id === stop.id ? "radio-button-on" : "radio-button-off"}
                                            size={20}
                                            color={selectedStop?.id === stop.id ? Colors.secondary : "rgba(255,255,255,0.4)"}
                                        />
                                        <Text style={[
                                            styles.stopName,
                                            selectedStop?.id === stop.id && styles.stopNameActive
                                        ]}>{stop.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </GlassCard>
                </View>
            )}
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '400',
    },
    card: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    form: {
        gap: 20,
    },
    roleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    roleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    roleActive: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    roleIconContainer: {},
    roleText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
    },
    roleTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    inputWrapper: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 17,
        fontWeight: '500',
    },
    autoGenInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(46, 204, 113, 0.15)',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.3)',
    },
    autoGenText: {
        color: '#fff',
        fontSize: 13,
    },
    highlight: {
        fontWeight: '700',
        color: '#2ecc71',
    },
    signupButton: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    linkText: {
        color: Colors.secondary,
        fontSize: 14,
        fontWeight: '700',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '500',
    },
    placeholderText: {
        color: 'rgba(255,255,255,0.3)',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 24,
        zIndex: 1000,
    },
    modalContent: {
        maxHeight: '70%',
        padding: 0,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    closeButton: {
        padding: 4,
    },
    stopList: {
        padding: 12,
    },
    stopItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    stopItemActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green tint
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    stopInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stopName: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    stopNameActive: {
        color: '#fff',
        fontWeight: '700',
    }
});

export default SignupScreen;
