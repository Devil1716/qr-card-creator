import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarPicker from './CalendarPicker';
import RecurrenceEditor from './RecurrenceEditor';
import { useAbsenceScheduler, AbsenceType } from '../hooks/useAbsenceScheduler';
import GlassCard from '../../../components/glass/GlassCard';
import GlassBackground from '../../../components/glass/GlassBackground';
import { Colors } from '../../../constants/colors';

const AbsenceManager = ({ onClose = () => { } }) => {
    const {
        absences,
        loading,
        syncStatus,
        createAbsence,
        deleteAbsence,
        getSuggestions
    } = useAbsenceScheduler();

    const [showCalendar, setShowCalendar] = useState(false);
    const [showRecurrence, setShowRecurrence] = useState(false);
    const [pendingAbsence, setPendingAbsence] = useState(null);

    // Get upcoming absences
    const upcomingAbsences = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return absences
            .filter(a => a.endDate >= today)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 5);
    }, [absences]);

    // Get smart suggestions
    const suggestions = useMemo(() => getSuggestions(), [getSuggestions]);

    // Generate marked dates for calendar
    const markedDates = useMemo(() => {
        const marks = {};
        absences.forEach(a => {
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);
            let current = new Date(start);

            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                marks[dateStr] = {
                    marked: true,
                    dotColor: Colors.error
                };
                current.setDate(current.getDate() + 1);
            }
        });
        return marks;
    }, [absences]);

    const handleDateSelect = ({ startDate, endDate }) => {
        setPendingAbsence({
            startDate,
            endDate,
            type: AbsenceType.HOLIDAY,
            affectedTrips: ['morning', 'evening'],
            recurrence: null
        });
        setShowRecurrence(true);
    };

    const handleRecurrenceSave = async (recurrence) => {
        if (pendingAbsence) {
            await createAbsence({
                ...pendingAbsence,
                recurrence
            });
            setPendingAbsence(null);
            Alert.alert('Success', 'Absence scheduled successfully!');
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Absence',
            'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteAbsence(id) }
            ]
        );
    };

    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const options = { month: 'short', day: 'numeric' };

        if (start === end) {
            return startDate.toLocaleDateString('en-US', options);
        }
        return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    };

    return (
        <GlassBackground>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onClose}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Schedule Absence</Text>
                    <View style={styles.syncIndicator}>
                        <View style={[
                            styles.syncDot,
                            syncStatus === 'synced' && styles.syncDotGreen,
                            syncStatus === 'syncing' && styles.syncDotYellow,
                            syncStatus === 'error' && styles.syncDotRed
                        ]} />
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Add New Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowCalendar(true)}
                    >
                        <Ionicons name="add-circle" size={24} color={Colors.primary} />
                        <Text style={styles.addButtonText}>Schedule New Absence</Text>
                    </TouchableOpacity>

                    {/* Smart Suggestions */}
                    {suggestions.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="bulb-outline" size={14} /> Suggestions
                            </Text>
                            {suggestions.map((s, i) => (
                                <GlassCard key={i} intensity={20} style={styles.suggestionCard}>
                                    <View style={styles.suggestionContent}>
                                        <Text style={styles.suggestionText}>{s.description}</Text>
                                        <TouchableOpacity
                                            style={styles.applySuggestion}
                                            onPress={() => {
                                                setPendingAbsence({
                                                    startDate: new Date().toISOString().split('T')[0],
                                                    endDate: new Date().toISOString().split('T')[0],
                                                    type: AbsenceType.HOLIDAY,
                                                    ...s.action
                                                });
                                                setShowRecurrence(true);
                                            }}
                                        >
                                            <Text style={styles.applyText}>Apply</Text>
                                        </TouchableOpacity>
                                    </View>
                                </GlassCard>
                            ))}
                        </View>
                    )}

                    {/* Upcoming Absences */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Upcoming</Text>

                        {upcomingAbsences.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
                                <Text style={styles.emptyText}>No scheduled absences</Text>
                            </View>
                        ) : (
                            upcomingAbsences.map((absence) => (
                                <GlassCard key={absence.id} intensity={25} style={styles.absenceCard}>
                                    <View style={styles.absenceRow}>
                                        <View style={styles.absenceInfo}>
                                            <View style={styles.dateRow}>
                                                <Ionicons name="calendar" size={16} color={Colors.primary} />
                                                <Text style={styles.dateText}>
                                                    {formatDateRange(absence.startDate, absence.endDate)}
                                                </Text>
                                            </View>
                                            <View style={styles.tagsRow}>
                                                {absence.recurrence && (
                                                    <View style={styles.tag}>
                                                        <Ionicons name="repeat" size={12} color={Colors.accent} />
                                                        <Text style={styles.tagText}>
                                                            {absence.recurrence.pattern}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View style={[styles.tag, styles.typeBadge]}>
                                                    <Text style={styles.tagText}>{absence.type}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(absence.id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </GlassCard>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Calendar Picker Modal */}
                <CalendarPicker
                    visible={showCalendar}
                    onClose={() => setShowCalendar(false)}
                    onSelect={handleDateSelect}
                    markedDates={markedDates}
                    minDate={new Date().toISOString().split('T')[0]}
                />

                {/* Recurrence Editor Modal */}
                <RecurrenceEditor
                    visible={showRecurrence}
                    onClose={() => {
                        setShowRecurrence(false);
                        if (pendingAbsence && !pendingAbsence.recurrence) {
                            // Save without recurrence
                            handleRecurrenceSave(null);
                        }
                    }}
                    onSave={handleRecurrenceSave}
                />
            </View>
        </GlassBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text
    },
    syncIndicator: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center'
    },
    syncDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.textSecondary
    },
    syncDotGreen: {
        backgroundColor: Colors.success
    },
    syncDotYellow: {
        backgroundColor: Colors.accent
    },
    syncDotRed: {
        backgroundColor: Colors.error
    },
    content: {
        flex: 1,
        paddingHorizontal: 20
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderStyle: 'dashed',
        marginBottom: 24
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12
    },
    suggestionCard: {
        marginBottom: 8
    },
    suggestionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: Colors.text
    },
    applySuggestion: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.primary,
        borderRadius: 8
    },
    applyText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 12
    },
    absenceCard: {
        marginBottom: 10
    },
    absenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    absenceInfo: {
        flex: 1
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6
    },
    typeBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)'
    },
    tagText: {
        fontSize: 11,
        color: Colors.textSecondary,
        textTransform: 'capitalize'
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default AbsenceManager;
