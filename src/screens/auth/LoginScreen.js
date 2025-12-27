import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { seedUsers } from '../../utils/userSeeder';

const LoginScreen = ({ navigation }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    // Seeding State
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState('');

    // Animations - run only once on mount
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const hasAnimated = useRef(false);

    // Use useMemo instead of useEffect for isAutoMode to prevent re-renders
    const isAutoMode = useMemo(() => !identifier.includes('@'), [identifier]);

    // Run animation only once
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
            // Navigation handled by auth listener
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
                    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                        <View style={styles.header}>
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Enter your Name to access your pass.</Text>
                        </View>

                        <GlassCard style={styles.card}>
                            <View style={styles.form}>

                                {/* Identifier Input */}
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.label}>FULL NAME / ID</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person" size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
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
                                        />
                                    </View>
                                </View>

                                {/* Password Section - Always rendered but conditionally visible */}
                                {!isAutoMode && (
                                    <View style={styles.inputWrapper}>
                                        <Text style={styles.label}>PASSWORD</Text>
                                        <View style={styles.inputContainer}>
                                            <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Enter Password"
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                returnKeyType="done"
                                                onSubmitEditing={handleLogin}
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.6)" />
                                            </TouchableOpacity>
                                        </View>
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
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={isLoading || isSeeding}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={[Colors.primary, '#4a90e2']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.loginButton}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.loginButtonText}>
                                                {isAutoMode ? "Enter R8" : "Sign In"}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Manual Seed Button */}
                                <TouchableOpacity onPress={handleSeeding} style={styles.seedLink} >
                                    <Text style={styles.seedLinkText}>Admin: Seed Database</Text>
                                </TouchableOpacity>

                            </View>
                        </GlassCard>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New here? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.linkText}>Create ID</Text>
                            </TouchableOpacity>
                        </View>
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
    content: {
        width: '100%',
    },
    header: {
        marginBottom: 40,
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
        paddingVertical: 10,
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
    loginButton: {
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    loginButtonText: {
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
