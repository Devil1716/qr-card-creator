import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';
import Constants from 'expo-constants';
import ChangePasswordModal from '../auth/ChangePasswordModal';

const SettingsScreen = ({ navigation }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Fetch basic user preferences if we stored them
        const fetchPrefs = async () => {
            if (auth.currentUser) {
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                    // In a real app we'd load notification prefs from storage/firestore here
                }
            }
        };
        fetchPrefs();
    }, []);

    const toggleNotifications = async (value) => {
        setNotificationsEnabled(value);
        // Persist to local storage or Firestore
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => auth.signOut()
                }
            ]
        );
    };

    const SettingItem = ({ icon, title, subtitle, onPress, toggle, value, danger }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress && toggle === undefined}
        >
            <View style={[styles.iconBox, danger && styles.dangerIconBox]}>
                <Ionicons
                    name={icon}
                    size={22}
                    color={danger ? Colors.error : Colors.text}
                />
            </View>
            <View style={styles.itemContent}>
                <Text style={[styles.itemTitle, danger && styles.dangerText]}>{title}</Text>
                {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
            </View>
            {toggle !== undefined ? (
                <Switch
                    value={value}
                    onValueChange={toggle}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.success }}
                    thumbColor={'#fff'}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
            )}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    return (
        <GlassBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Profile Section */}
                <GlassCard style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {userData?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{userData?.name || 'User'}</Text>
                        <Text style={styles.profileEmail}>{auth.currentUser?.email}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{userData?.role?.toUpperCase()}</Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Account Settings */}
                <SectionHeader title="ACCOUNT" />
                <GlassCard style={styles.sectionCard} intensity={20}>
                    <SettingItem
                        icon="lock-closed-outline"
                        title="Change Password"
                        subtitle="Update your security credentials"
                        onPress={() => setShowPasswordModal(true)}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Privacy & Security"
                        onPress={() => { }}
                    />
                </GlassCard>

                {/* Preferences */}
                <SectionHeader title="PREFERENCES" />
                <GlassCard style={styles.sectionCard} intensity={20}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Notifications"
                        toggle={toggleNotifications}
                        value={notificationsEnabled}
                    />
                </GlassCard>

                {/* Support */}
                <SectionHeader title="SUPPORT" />
                <GlassCard style={styles.sectionCard} intensity={20}>
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help Center"
                        onPress={() => Linking.openURL('https://r8.bus/help')} // Placeholder
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="information-circle-outline"
                        title="About R8"
                        subtitle={`Version ${Constants.expoConfig?.version || '1.0.0'}`}
                        onPress={() => { }}
                    />
                </GlassCard>

                {/* Logout */}
                <GlassCard style={[styles.sectionCard, styles.logoutCard]} intensity={10}>
                    <SettingItem
                        icon="log-out-outline"
                        title="Sign Out"
                        danger
                        onPress={handleSignOut}
                    />
                </GlassCard>

            </ScrollView>

            <ChangePasswordModal
                visible={showPasswordModal}
                onSuccess={() => setShowPasswordModal(false)}
            />
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff'
    },
    scrollContent: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 32
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff'
    },
    profileInfo: {
        flex: 1
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4
    },
    profileEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start'
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.accent,
        letterSpacing: 1
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
        marginTop: 12
    },
    sectionCard: {
        padding: 0,
        overflow: 'hidden',
        marginBottom: 20
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        minHeight: 64
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    dangerIconBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)'
    },
    itemContent: {
        flex: 1
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff'
    },
    dangerText: {
        color: Colors.error
    },
    itemSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 68
    },
    logoutCard: {
        marginTop: 20,
        borderColor: 'rgba(239, 68, 68, 0.2)'
    }
});

export default SettingsScreen;
