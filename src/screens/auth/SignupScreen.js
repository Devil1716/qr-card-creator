import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';

const SignupScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // 'student' | 'driver'
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setIsLoading(true);
        try {
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
                busId: null, // To be assigned
                stopId: null // To be assigned
            });

            // Navigation handled by auth listener
        } catch (error) {
            console.error('Signup error:', error);
            Alert.alert('Signup Failed', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassBackground>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join the network</Text>
                    </View>

                    <GlassCard>
                        <View style={styles.form}>
                            {/* Role Toogle */}
                            <View style={styles.roleContainer}>
                                <TouchableOpacity
                                    style={[styles.roleOption, role === 'student' && styles.roleActive]}
                                    onPress={() => setRole('student')}
                                >
                                    <Ionicons name="school-outline" size={20} color={role === 'student' ? '#fff' : Colors.textMuted} />
                                    <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>Student</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, role === 'driver' && styles.roleActive]}
                                    onPress={() => setRole('driver')}
                                >
                                    <Ionicons name="bus-outline" size={20} color={role === 'driver' ? '#fff' : Colors.textMuted} />
                                    <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Name Input */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor={Colors.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor={Colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor={Colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Signup Button */}
                            <TouchableOpacity
                                style={styles.signupButton}
                                onPress={handleSignup}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.signupButtonText}>Sign Up</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </GlassCard>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
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
        marginBottom: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    form: {
        gap: 16,
        paddingVertical: 10,
    },
    roleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        marginBottom: 10,
    },
    roleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    roleActive: {
        backgroundColor: Colors.primary,
    },
    roleText: {
        color: Colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
    roleTextActive: {
        color: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: Colors.text,
        fontSize: 16,
    },
    signupButton: {
        backgroundColor: Colors.secondary, // Green for signup
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    }
});

export default SignupScreen;
