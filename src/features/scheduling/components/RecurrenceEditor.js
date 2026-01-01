import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { RecurrencePattern } from '../hooks/useAbsenceScheduler';
import { Colors } from '../../../constants/colors';

const DAYS_OF_WEEK = [
    { key: 0, short: 'S', full: 'Sunday' },
    { key: 1, short: 'M', full: 'Monday' },
    { key: 2, short: 'T', full: 'Tuesday' },
    { key: 3, short: 'W', full: 'Wednesday' },
    { key: 4, short: 'T', full: 'Thursday' },
    { key: 5, short: 'F', full: 'Friday' },
    { key: 6, short: 'S', full: 'Saturday' }
];

const RecurrenceEditor = ({
    visible = false,
    onClose = () => { },
    onSave = () => { },
    initialRecurrence = null
}) => {
    const [pattern, setPattern] = useState(initialRecurrence?.pattern || RecurrencePattern.NONE);
    const [selectedDays, setSelectedDays] = useState(initialRecurrence?.daysOfWeek || []);
    const [dayOfMonth, setDayOfMonth] = useState(initialRecurrence?.dayOfMonth || 1);

    const handlePatternChange = (newPattern) => {
        setPattern(newPattern);
        // Reset selections when pattern changes
        if (newPattern !== RecurrencePattern.WEEKLY) {
            setSelectedDays([]);
        }
    };

    const toggleDay = (day) => {
        setSelectedDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            }
            return [...prev, day].sort();
        });
    };

    const handleSave = () => {
        if (pattern === RecurrencePattern.NONE) {
            onSave(null);
        } else {
            onSave({
                pattern,
                daysOfWeek: pattern === RecurrencePattern.WEEKLY ? selectedDays : undefined,
                dayOfMonth: pattern === RecurrencePattern.MONTHLY ? dayOfMonth : undefined
            });
        }
        onClose();
    };

    const getRecurrenceDescription = () => {
        switch (pattern) {
            case RecurrencePattern.WEEKLY:
                if (selectedDays.length === 0) return 'Select days...';
                const dayNames = selectedDays.map(d => DAYS_OF_WEEK[d].full);
                return `Every ${dayNames.join(', ')}`;
            case RecurrencePattern.MONTHLY:
                return `On the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)} of each month`;
            case RecurrencePattern.YEARLY:
                return 'Same date each year';
            default:
                return 'Does not repeat';
        }
    };

    const getOrdinalSuffix = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={80} style={styles.container} tint="dark">
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Repeat</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Pattern Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Frequency</Text>

                            {Object.values(RecurrencePattern).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.patternOption,
                                        pattern === p && styles.patternOptionActive
                                    ]}
                                    onPress={() => handlePatternChange(p)}
                                >
                                    <Text style={[
                                        styles.patternText,
                                        pattern === p && styles.patternTextActive
                                    ]}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                    {pattern === p && (
                                        <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Weekly Day Selection */}
                        {pattern === RecurrencePattern.WEEKLY && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>On these days</Text>
                                <View style={styles.daysRow}>
                                    {DAYS_OF_WEEK.map((day) => (
                                        <TouchableOpacity
                                            key={day.key}
                                            style={[
                                                styles.dayButton,
                                                selectedDays.includes(day.key) && styles.dayButtonActive
                                            ]}
                                            onPress={() => toggleDay(day.key)}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                selectedDays.includes(day.key) && styles.dayTextActive
                                            ]}>
                                                {day.short}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Monthly Day Selection */}
                        {pattern === RecurrencePattern.MONTHLY && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Day of month</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.monthDaysRow}>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <TouchableOpacity
                                                key={day}
                                                style={[
                                                    styles.monthDayButton,
                                                    dayOfMonth === day && styles.monthDayButtonActive
                                                ]}
                                                onPress={() => setDayOfMonth(day)}
                                            >
                                                <Text style={[
                                                    styles.monthDayText,
                                                    dayOfMonth === day && styles.monthDayTextActive
                                                ]}>
                                                    {day}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {/* Preview */}
                        <View style={styles.previewSection}>
                            <Ionicons name="repeat" size={18} color={Colors.textSecondary} />
                            <Text style={styles.previewText}>{getRecurrenceDescription()}</Text>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)'
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        padding: 20
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12
    },
    patternOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        marginBottom: 8
    },
    patternOptionActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderWidth: 1,
        borderColor: Colors.primary
    },
    patternText: {
        fontSize: 16,
        color: Colors.text
    },
    patternTextActive: {
        fontWeight: '600'
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    dayButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dayButtonActive: {
        backgroundColor: Colors.primary
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary
    },
    dayTextActive: {
        color: '#fff'
    },
    monthDaysRow: {
        flexDirection: 'row',
        gap: 8
    },
    monthDayButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    monthDayButtonActive: {
        backgroundColor: Colors.primary
    },
    monthDayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary
    },
    monthDayTextActive: {
        color: '#fff'
    },
    previewSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12
    },
    previewText: {
        fontSize: 14,
        color: Colors.text,
        flex: 1
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)'
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center'
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center'
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff'
    }
});

export default RecurrenceEditor;
