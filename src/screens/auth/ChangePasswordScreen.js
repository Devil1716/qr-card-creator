import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const ChangePasswordScreen = ({ navigation }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        Keyboard.dismiss();

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No user logged in.");

            // 1. Update Auth Password
            await updatePassword(user, newPassword);

            // 2. Update Firestore Flag
            await updateDoc(doc(db, 'users', user.uid), {
                requiresPasswordChange: false
            });

            Alert.alert('Success', 'Password updated successfully!', [
                {
                    text: 'Continue',
                    onPress: () => {
                        // Navigation will be handled by parent re-render or explicit nav logic if needed
                        // But usually we just update state. 
                        // However, since we might be in a separate stack or blocking view, we might need a callback or just standard nav.
                        // Assuming we are in a modal or special stack.
                        // Actually, in App.js we will render this Conditionally.
                    }
                }
            ]);

        } catch (error) {
            console.error('Password change error:', error);
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert('Security Check', 'Please re-login to change your password.');
                await auth.signOut();
            } else {
                Alert.alert('Error', error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GlassBackground>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Security Update</Text>
                    <Text style={styles.subtitle}>Please set a new secure password.</Text>
                </View>

                <GlassCard>
                    <View style={styles.form}>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>NEW PASSWORD</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min 6 characters"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>CONFIRM PASSWORD</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Re-enter password"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPassBtn}>
                            <Text style={styles.showPassText}>{showPassword ? "Hide Password" : "Show Password"}</Text>
                        </TouchableOpacity>


                        <TouchableOpacity
                            onPress={handleChangePassword}
                            disabled={isLoading}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[Colors.secondary, '#2ecc71']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Update Password</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </View>
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
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
    showPassBtn: {
        alignSelf: 'flex-end',
    },
    showPassText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
    },
    button: {
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
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default ChangePasswordScreen;
