import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { seedUsers } from '../../utils/userSeeder';
import FluidButton from '../../components/buttons/FluidButton';

const LoginScreen = ({ navigation }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Seeding State
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState('');

    // Staggered entrance animations
    const logoAnim = useRef(new Animated.Value(0)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(0)).current;
    const footerAnim = useRef(new Animated.Value(0)).current;

    // Logo breathing animation
    const logoBreathAnim = useRef(new Animated.Value(0)).current;

    // Input focus animations
    const identifierFocusAnim = useRef(new Animated.Value(0)).current;
    const passwordFocusAnim = useRef(new Animated.Value(0)).current;

    const hasAnimated = useRef(false);

    const isAutoMode = useMemo(() => !identifier.includes('@'), [identifier]);

    // Staggered entrance animation sequence
    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        const staggerDelay = 150;
        const duration = 700;

        Animated.stagger(staggerDelay, [
            // Logo entrance
            Animated.timing(logoAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
                easing: Easing.out(Easing.back(1.2)),
            }),
            // Title entrance
            Animated.timing(titleAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            // Card entrance
            Animated.timing(cardAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            // Footer entrance
            Animated.timing(footerAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();

        // Start logo breathing animation (loops forever)
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoBreathAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
                Animated.timing(logoBreathAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.sin),
                }),
            ])
        ).start();
    }, []);

    // Handle input focus animations
    useEffect(() => {
        Animated.timing(identifierFocusAnim, {
            toValue: isIdentifierFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
            easing: Easing.out(Easing.cubic),
        }).start();
    }, [isIdentifierFocused]);

    useEffect(() => {
        Animated.timing(passwordFocusAnim, {
            toValue: isPasswordFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
            easing: Easing.out(Easing.cubic),
        }).start();
    }, [isPasswordFocused]);

    const handleLogin = async () => {
        if (!identifier.trim()) {
            Alert.alert('Error', 'Please enter your Name or ID.');
            return;
        }

        setIsLoading(true);
        Keyboard.dismiss();

        try {
            let emailToUse = identifier.trim();
            let passwordToUse = password;

            if (!emailToUse.includes('@')) {
                const cleanName = emailToUse.replace(/\s+/g, '').toLowerCase();
                emailToUse = `${cleanName}@r8.bus`;
                passwordToUse = emailToUse;
            } else {
                if (!password) {
                    throw new Error('Please enter your password.');
                }
            }

            console.log('Attempting login with:', emailToUse);
            await signInWithEmailAndPassword(auth, emailToUse, passwordToUse);
        } catch (error) {
            console.error('Login error:', error);
            let msg = error.message;
            if (error.code === 'auth/invalid-email') msg = "Invalid ID format.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "ID not found. If you don't have one, please Join R8 first.";
            Alert.alert('Login Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeeding = async () => {
        Alert.alert(
            "Admin Action",
            "This will create accounts for all 22 preset users. Existing users may error out (safe to ignore). Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Start Seeding",
                    onPress: async () => {
                        setIsSeeding(true);
                        setSeedStatus('Starting...');
                        const result = await seedUsers((msg) => setSeedStatus(msg));
                        setIsSeeding(false);
                        setSeedStatus('');
                        Alert.alert("Seeding Complete", `Success: ${result.successCount}\nFailed/Exist: ${result.failCount}`);
                    }
                }
            ]
        );
    };

    // Interpolations for entrance animations
    const logoStyle = {
        opacity: logoAnim,
        transform: [
            { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
            { scale: logoBreathAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
        ],
    };

    const titleStyle = {
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    };

    const cardStyle = {
        opacity: cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
    };

    const footerStyle = {
        opacity: footerAnim,
        transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    };

    // Input focus interpolations
    const identifierBorderColor = identifierFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.1)', Colors.primary],
    });
    const identifierIconColor = identifierFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255,255,255,0.4)', Colors.primaryLight],
    });

    const passwordBorderColor = passwordFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.1)', Colors.primary],
    });
    const passwordIconColor = passwordFocusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255,255,255,0.4)', Colors.primaryLight],
    });

    return (
        <GlassBackground>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Animated R8 Logo */}
                    <Animated.View style={[styles.logoContainer, logoStyle]}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoBadge}
                        >
                            <Text style={styles.logoText}>R8</Text>
                        </LinearGradient>
                        <View style={styles.logoGlow} />
                    </Animated.View>

                    {/* Header with staggered animation */}
                    <Animated.View style={[styles.header, titleStyle]}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Enter your name to access your pass</Text>
                    </Animated.View>

                    {/* Card with staggered animation */}
                    <Animated.View style={cardStyle}>
                        <GlassCard style={styles.card}>
                            <View style={styles.form}>

                                {/* Identifier Input with focus effect */}
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>FULL NAME / ID</Text>
                                    <Animated.View style={[
                                        styles.inputContainer,
                                        { borderColor: identifierBorderColor }
                                    ]}>
                                        <Animated.View style={{ marginRight: 12 }}>
                                            <Ionicons
                                                name="person"
                                                size={20}
                                                color={isIdentifierFocused ? Colors.primaryLight : 'rgba(255,255,255,0.4)'}
                                            />
                                        </Animated.View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. Rahul Sharma"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={identifier}
                                            onChangeText={setIdentifier}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            returnKeyType={isAutoMode ? "done" : "next"}
                                            blurOnSubmit={isAutoMode}
                                            onSubmitEditing={isAutoMode ? handleLogin : undefined}
                                            onFocus={() => setIsIdentifierFocused(true)}
                                            onBlur={() => setIsIdentifierFocused(false)}
                                        />
                                    </Animated.View>
                                </View>

                                {/* Password Section */}
                                {!isAutoMode && (
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.label}>PASSWORD</Text>
                                        <Animated.View style={[
                                            styles.inputContainer,
                                            { borderColor: passwordBorderColor }
                                        ]}>
                                            <Animated.View style={{ marginRight: 12 }}>
                                                <Ionicons
                                                    name="lock-closed"
                                                    size={20}
                                                    color={isPasswordFocused ? Colors.primaryLight : 'rgba(255,255,255,0.4)'}
                                                />
                                            </Animated.View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter Password"
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                returnKeyType="done"
                                                onSubmitEditing={handleLogin}
                                                onFocus={() => setIsPasswordFocused(true)}
                                                onBlur={() => setIsPasswordFocused(false)}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.6)" />
                                            </TouchableOpacity>
                                        </Animated.View>
                                    </View>
                                )}

                                {/* Remember Me Checkbox */}
                                <TouchableOpacity
                                    style={styles.rememberRow}
                                    onPress={() => setRememberMe(!rememberMe)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                                        {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                    <Text style={styles.rememberText}>Remember me</Text>
                                </TouchableOpacity>

                                {isSeeding && (
                                    <View style={styles.seedingContainer}>
                                        <ActivityIndicator size="small" color={Colors.secondary} />
                                        <Text style={styles.seedingText}>{seedStatus}</Text>
                                    </View>
                                )}

                                {/* Login Button */}
                                <View style={{ marginTop: 10 }}>
                                    <FluidButton
                                        title={isAutoMode ? "Enter R8" : "Sign In"}
                                        onPress={handleLogin}
                                        isLoading={isLoading || isSeeding}
                                        type="primary"
                                        size="large"
                                        icon="arrow-forward"
                                    />
                                </View>

                                {/* Manual Seed Button */}
                                <TouchableOpacity onPress={handleSeeding} style={styles.seedLink} >
                                    <Text style={styles.seedLinkText}>Admin: Seed Database</Text>
                                </TouchableOpacity>

                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Footer with staggered animation */}
                    <Animated.View style={[styles.footer, footerStyle]}>
                        <Text style={styles.footerText}>New here? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={styles.linkText}>Create ID</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    // Logo Styles
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoBadge: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 15,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
    },
    logoGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primary,
        opacity: 0.15,
        zIndex: -1,
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '400',
        textAlign: 'center',
    },
    card: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    form: {
        gap: 20,
        paddingVertical: 10,
    },
    inputWrapper: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1.5,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 58,
        borderWidth: 1.5,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginLeft: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: Colors.secondary,
        borderColor: Colors.secondary,
    },
    rememberText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    seedingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'center',
    },
    seedingText: {
        color: Colors.secondary,
        fontSize: 12,
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
    seedLink: {
        alignSelf: 'center',
        marginTop: 10,
    },
    seedLinkText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
    }
});

export default LoginScreen;

