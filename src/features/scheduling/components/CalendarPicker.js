import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../../../constants/colors';

/**
 * Calendar picker for selecting date ranges
 */
const CalendarPicker = ({
    visible = false,
    onClose = () => { },
    onSelect = () => { },
    markedDates = {},
    minDate = null,
    maxDate = null,
    title = 'Select Dates'
}) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Generate marked dates for selected range
    const allMarkedDates = useMemo(() => {
        const marks = { ...markedDates };

        if (startDate && !endDate) {
            // Single date selected
            marks[startDate] = {
                ...marks[startDate],
                selected: true,
                startingDay: true,
                endingDay: true,
                color: Colors.primary
            };
        } else if (startDate && endDate) {
            // Range selected
            const start = new Date(startDate);
            const end = new Date(endDate);

            let current = new Date(start);
            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                const isStart = dateStr === startDate;
                const isEnd = dateStr === endDate;

                marks[dateStr] = {
                    ...marks[dateStr],
                    selected: true,
                    startingDay: isStart,
                    endingDay: isEnd,
                    color: Colors.primary
                };

                current.setDate(current.getDate() + 1);
            }
        }

        return marks;
    }, [startDate, endDate, markedDates]);

    const handleDayPress = (day) => {
        if (!startDate || (startDate && endDate)) {
            // Start new selection
            setStartDate(day.dateString);
            setEndDate(null);
        } else {
            // Complete range
            const start = new Date(startDate);
            const end = new Date(day.dateString);

            if (end < start) {
                // Swap if end is before start
                setStartDate(day.dateString);
                setEndDate(startDate);
            } else {
                setEndDate(day.dateString);
            }
        }
    };

    const handleConfirm = () => {
        if (startDate) {
            onSelect({
                startDate,
                endDate: endDate || startDate
            });
            setStartDate(null);
            setEndDate(null);
            onClose();
        }
    };

    const handleCancel = () => {
        setStartDate(null);
        setEndDate(null);
        onClose();
    };

    const getSelectionText = () => {
        if (!startDate) return 'Tap a date to start';
        if (!endDate) return `From: ${formatDate(startDate)} — Tap end date`;
        return `${formatDate(startDate)} → ${formatDate(endDate)}`;
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const calendarTheme = {
        backgroundColor: 'transparent',
        calendarBackground: 'transparent',
        textSectionTitleColor: Colors.textSecondary,
        selectedDayBackgroundColor: Colors.primary,
        selectedDayTextColor: '#ffffff',
        todayTextColor: Colors.primary,
        dayTextColor: Colors.text,
        textDisabledColor: 'rgba(255,255,255,0.2)',
        dotColor: Colors.primary,
        selectedDotColor: '#ffffff',
        arrowColor: Colors.primary,
        monthTextColor: Colors.text,
        textDayFontWeight: '500',
        textMonthFontWeight: '700',
        textDayHeaderFontWeight: '600',
        textDayFontSize: 14,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 12
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <BlurView intensity={80} style={styles.container} tint="dark">
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Selection indicator */}
                    <View style={styles.selectionBanner}>
                        <Ionicons
                            name={endDate ? "calendar" : "calendar-outline"}
                            size={18}
                            color={Colors.primary}
                        />
                        <Text style={styles.selectionText}>{getSelectionText()}</Text>
                    </View>

                    {/* Calendar */}
                    <Calendar
                        markingType="period"
                        markedDates={allMarkedDates}
                        onDayPress={handleDayPress}
                        minDate={minDate}
                        maxDate={maxDate}
                        theme={calendarTheme}
                        style={styles.calendar}
                        enableSwipeMonths
                    />

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                !startDate && styles.confirmButtonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!startDate}
                        >
                            <Text style={styles.confirmButtonText}>Confirm</Text>
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
        justifyContent: 'center',
        padding: 20
    },
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
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
    selectionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
    },
    selectionText: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600'
    },
    calendar: {
        marginHorizontal: 10
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12
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
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center'
    },
    confirmButtonDisabled: {
        opacity: 0.5
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff'
    }
});

export default CalendarPicker;
