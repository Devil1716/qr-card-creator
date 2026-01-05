import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator, Alert, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import * as Haptics from 'expo-haptics';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const ChangePasswordModal = ({ visible, onSuccess }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePassword = (password) => {
        // Minimum 6 chars, basically just sanity check
        return password.length >= 6;
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (!validatePassword(newPassword)) {
            Alert.alert('Error', 'New password must be at least 6 characters long');
            return;
        }

        if (newPassword === currentPassword) {
            Alert.alert('Error', 'New password cannot be the same as the old one');
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user || !user.email) return;

            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update Password
            await updatePassword(user, newPassword);

            // 3. Update Firestore flag
            await updateDoc(doc(db, 'users', user.uid), {
                requiresPasswordChange: false
            });

            // Instant success - no blocking Alert
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('Password change error:', error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Incorrect current password');
            } else {
                Alert.alert('Error', error.message);
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => { }} // Prevent back button closing
        >
            <View style={styles.overlay}>
                <GlassCard style={styles.container} intensity={50}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="lock-closed" size={32} color={Colors.accent} />
                            </View>
                            <Text style={styles.title}>Security Update</Text>
                            <Text style={styles.subtitle}>
                                For your security, please change your password from the default email-based password.
                            </Text>
                        </View>

                        <View style={styles.form}>
                            {/* Current Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>CURRENT PASSWORD</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="key-outline" size={20} color="rgba(255,255,255,0.5)" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter current password"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        secureTextEntry
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                    />
                                </View>
                            </View>

                            {/* New Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>NEW PASSWORD</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Min 6 characters"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                </View>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Re-enter new password"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        secureTextEntry
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleChangePassword}
                                disabled={loading}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={[Colors.primary, Colors.accent]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.button}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Update Password</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                    </KeyboardAvoidingView>
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 24
    },
    container: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    header: {
        alignItems: 'center',
        marginBottom: 32
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(245, 158, 11, 0.15)', // Amber tint
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 20
    },
    form: {
        gap: 20
    },
    inputGroup: {
        gap: 8
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1,
        marginLeft: 4
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        gap: 12
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16
    },
    button: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5
    }
});

export default ChangePasswordModal;
