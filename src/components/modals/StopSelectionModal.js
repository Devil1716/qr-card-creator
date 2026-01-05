import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import GlassCard from '../glass/GlassCard';
import FluidButton from '../buttons/FluidButton';
import routePrediction from '../../features/location/services/RoutePrediction';

const StopSelectionModal = ({ visible, onSelect, initialStop = '' }) => {
    const [stopName, setStopName] = useState(initialStop);

    // Get stops from RoutePrediction service (loaded from database/config)
    const availableStops = useMemo(() => {
        const stops = routePrediction.getStops();
        return stops.map(stop => stop.name);
    }, []);

    const handleSave = () => {
        if (stopName.trim().length > 0) {
            onSelect(stopName.trim());
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Blur backdrop simulated by dark overlay for now, or use BlurView if available */}
                <View style={styles.backdrop} />

                <GlassCard style={styles.modalContent} intensity={80}>
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="bus-outline" size={28} color={Colors.primary} />
                        </View>
                        <Text style={styles.title}>Select Your Stop</Text>
                        <Text style={styles.subtitle}>
                            Where will you be boarding/deboarding daily?
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.5)" />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter stop name..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={stopName}
                            onChangeText={setStopName}
                            autoFocus={true}
                        />
                    </View>

                    <Text style={styles.label}>SELECT YOUR STOP</Text>
                    <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
                        {availableStops.map((stop, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.stopItem,
                                    stopName === stop && styles.stopItemActive
                                ]}
                                onPress={() => setStopName(stop)}
                            >
                                <Ionicons
                                    name={stopName === stop ? "radio-button-on" : "radio-button-off"}
                                    size={20}
                                    color={stopName === stop ? Colors.primary : 'rgba(255,255,255,0.4)'}
                                />
                                <Text style={[
                                    styles.stopItemText,
                                    stopName === stop && styles.stopItemTextActive
                                ]}>{stop}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.saveButton, !stopName && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!stopName}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="checkmark-circle" size={20} color={stopName ? "#111" : "rgba(0,0,0,0.3)"} />
                            <Text style={[styles.saveButtonText, !stopName && styles.saveButtonTextDisabled]}>
                                Save & Continue
                            </Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 30,
        padding: 24,
        paddingBottom: 32,
        maxHeight: '80%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(56, 189, 248, 0.15)', // Light blue hint
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 12,
        letterSpacing: 1,
    },
    suggestionsList: {
        flexGrow: 0,
        marginBottom: 24,
        maxHeight: 200,
    },
    stopItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    stopItemActive: {
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
    },
    stopItemText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 15,
        fontWeight: '500',
    },
    stopItemTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 8,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 50,
        gap: 10,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    saveButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    saveButtonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '700',
    },
    saveButtonTextDisabled: {
        color: 'rgba(0,0,0,0.3)',
    },
});

export default StopSelectionModal;
