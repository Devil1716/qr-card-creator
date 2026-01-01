import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import GlassCard from '../../../components/glass/GlassCard';
import routePrediction from '../../location/services/RoutePrediction';

const RouteTimeline = ({ currentProgress = 0, nextStopId }) => {
    // Get stops from the comprehensive route definition
    const stops = useMemo(() => routePrediction.getStops(), []);

    // Determine active segment index
    // If nextStopId is null, we might be at start or end
    const activeIndex = useMemo(() => {
        if (!nextStopId) return 0;
        return stops.findIndex(s => s.id === nextStopId) - 1;
    }, [stops, nextStopId]);

    return (
        <GlassCard intensity={25} style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="map-outline" size={20} color={Colors.primary} />
                <Text style={styles.title}>Route Timeline</Text>
            </View>

            <ScrollView
                horizontal={false}
                showsVerticalScrollIndicator={false}
                style={styles.scrollArea}
                contentContainerStyle={styles.listContent}
            >
                {stops.map((stop, index) => {
                    // Logic to determine state of each stop
                    // 0: Passed, 1: Active/Next, 2: Future
                    // This is a simplified logic, ideally we track 'passed' state more robustly
                    let status = 'future';
                    if (index < activeIndex) status = 'passed';
                    else if (index === activeIndex + 1) status = 'next';
                    else if (index === activeIndex) status = 'current';

                    // Special case for first stop
                    if (index === 0 && activeIndex === -1) status = 'next';

                    return (
                        <View key={stop.id} style={styles.stopItem}>
                            {/* Time Column */}
                            <View style={styles.timeCol}>
                                <Text style={[
                                    styles.timeText,
                                    status === 'passed' && styles.timePassed,
                                    status === 'next' && styles.timeNext
                                ]}>
                                    {stop.morningTime}
                                </Text>
                            </View>

                            {/* Timeline Line & Dot */}
                            <View style={styles.lineCol}>
                                <View style={[
                                    styles.line,
                                    index === stops.length - 1 && styles.lineHidden,
                                    status === 'passed' && styles.linePassed
                                ]} />
                                <View style={[
                                    styles.dot,
                                    status === 'passed' && styles.dotPassed,
                                    status === 'next' && styles.dotNext,
                                    status === 'current' && styles.dotCurrent
                                ]}>
                                    {status === 'passed' && (
                                        <Ionicons name="checkmark" size={10} color="#000" />
                                    )}
                                    {status === 'next' && (
                                        <View style={styles.pulseDot} />
                                    )}
                                </View>
                            </View>

                            {/* Stop Info */}
                            <View style={styles.infoCol}>
                                <Text style={[
                                    styles.stopName,
                                    status === 'passed' && styles.textPassed,
                                    status === 'next' && styles.textNext
                                ]}>
                                    {stop.name}
                                </Text>
                                {status === 'next' && (
                                    <Text style={styles.nextLabel}>Next Stop</Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 300,
        marginBottom: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        marginBottom: 12
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text
    },
    scrollArea: {
        maxHeight: 220
    },
    listContent: {
        paddingBottom: 10
    },
    stopItem: {
        flexDirection: 'row',
        height: 56, // Fixed height for alignment
    },
    timeCol: {
        width: 50,
        alignItems: 'flex-end',
        paddingRight: 12,
        paddingTop: 2
    },
    timeText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontVariant: ['tabular-nums']
    },
    timePassed: {
        color: Colors.textMuted,
        opacity: 0.6
    },
    timeNext: {
        color: Colors.primary,
        fontWeight: '700'
    },
    lineCol: {
        width: 20,
        alignItems: 'center'
    },
    line: {
        position: 'absolute',
        top: 8,
        bottom: -48, // Connect to next
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 1
    },
    lineHidden: {
        display: 'none'
    },
    linePassed: {
        backgroundColor: Colors.primaryDark
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.backgroundSecondary,
        borderWidth: 2,
        borderColor: Colors.textMuted,
        zIndex: 2,
        marginTop: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dotPassed: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    dotNext: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.primary, // Electric Violet
        borderColor: '#fff',
        marginLeft: -2,
        marginTop: 2,
        shadowColor: Colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 8
    },
    dotCurrent: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent
    },
    infoCol: {
        flex: 1,
        paddingLeft: 12,
        paddingTop: 1
    },
    stopName: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500'
    },
    textPassed: {
        color: Colors.textMuted,
        textDecorationLine: 'line-through'
    },
    textNext: {
        color: Colors.text,
        fontWeight: '700',
        fontSize: 15
    },
    nextLabel: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '600',
        marginTop: 2
    }
});

export default RouteTimeline;
