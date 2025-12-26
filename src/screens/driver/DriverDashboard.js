import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import GlassBackground from '../../components/glass/GlassBackground';
import GlassCard from '../../components/glass/GlassCard';
import { Colors } from '../../constants/colors';

const DriverDashboard = ({ onSignOut }) => {
    const [morningCount, setMorningCount] = useState(0);
    const [eveningCount, setEveningCount] = useState(0);
    const [passengers, setPassengers] = useState([]);
    const [loading, setLoading] = useState(true);

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        // Query today's opt-ins
        const q = query(collection(db, 'optins'), where('date', '==', todayStr));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let mCount = 0;
            let eCount = 0;
            const passList = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.morning) mCount++;
                if (data.evening) eCount++;
                passList.push({ id: doc.id, ...data });
            });

            setMorningCount(mCount);
            setEveningCount(eCount);
            setPassengers(passList);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

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
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                            <Text style={styles.greeting}>Driver</Text>
                            <Text style={styles.title}>Summary</Text>
                        </View>
                        <TouchableOpacity onPress={onSignOut} style={styles.signOutBtn}>
                            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.dateText}>{new Date().toDateString()}</Text>
                </View>

                {/* Counter Cards */}
                <View style={styles.counterRow}>
                    <GlassCard style={styles.counterCard} intensity={40}>
                        <Ionicons name="sunny" size={32} color={Colors.accent} />
                        <Text style={styles.countNumber}>{morningCount}</Text>
                        <Text style={styles.countLabel}>Morning</Text>
                    </GlassCard>

                    <GlassCard style={styles.counterCard} intensity={25}>
                        <Ionicons name="moon" size={32} color={Colors.primaryLight} />
                        <Text style={styles.countNumber}>{eveningCount}</Text>
                        <Text style={styles.countLabel}>Evening</Text>
                    </GlassCard>
                </View>

                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>Boarding List</Text>
                    {passengers.length > 0 ? (
                        <FlatList
                            data={passengers}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <GlassCard intensity={15} style={styles.passengerCard}>
                                    <View style={styles.passengerRow}>
                                        <View style={styles.passengerInfo}>
                                            <Text style={styles.passengerName}>{item.userName}</Text>
                                            <Text style={styles.passengerSubtext}>Stop: {item.stopId || 'Unassigned'}</Text>
                                        </View>
                                        <View style={styles.indicatorContainer}>
                                            {item.morning && <Ionicons name="sunny" size={16} color={Colors.accent} />}
                                            {item.evening && <Ionicons name="moon" size={16} color={Colors.primaryLight} style={{ marginLeft: 8 }} />}
                                        </View>
                                    </View>
                                </GlassCard>
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
                        />
                    ) : (
                        <GlassCard>
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
                                <Text style={styles.emptyText}>No passengers opted in yet.</Text>
                            </View>
                        </GlassCard>
                    )}
                </View>
            </View>
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 32,
    },
    greeting: {
        fontSize: 18,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    title: {
        fontSize: 36,
        color: Colors.text,
        fontWeight: '700',
        letterSpacing: -1,
    },
    signOutBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    counterRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    counterCard: {
        flex: 1,
        alignItems: 'center',
        padding: 24,
    },
    countNumber: {
        fontSize: 32,
        color: Colors.text,
        fontWeight: '800',
        marginVertical: 4,
    },
    countLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    listSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        color: Colors.text,
        fontWeight: '600',
        marginBottom: 16,
    },
    passengerCard: {
        padding: 16,
        marginVertical: 6,
    },
    passengerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    passengerName: {
        fontSize: 17,
        color: Colors.text,
        fontWeight: '600',
    },
    passengerSubtext: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 2,
    },
    indicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyText: {
        color: Colors.textSecondary,
        textAlign: 'center',
    }
});

export default DriverDashboard;
