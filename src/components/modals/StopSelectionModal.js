import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import GlassCard from '../glass/GlassCard';
import FluidButton from '../buttons/FluidButton';

const StopSelectionModal = ({ visible, onSelect, initialStop = '' }) => {
    const [stopName, setStopName] = useState(initialStop);

    // Initial simple list, can be expanded or fetched from API later
    const SUGGESTED_STOPS = [
        "Main Gate", "Hostel Block A", "Library", "Cafeteria", "Sports Complex", "City Center"
    ];

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

                    <Text style={styles.label}>SUGGESTED STOPS</Text>
                    <ScrollView style={styles.suggestionsList} horizontal={true} showsHorizontalScrollIndicator={false}>
                        {SUGGESTED_STOPS.map((stop, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.chip,
                                    stopName === stop && styles.chipActive
                                ]}
                                onPress={() => setStopName(stop)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    stopName === stop && styles.chipTextActive
                                ]}>{stop}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <FluidButton
                            title="Confirm Stop"
                            onPress={handleSave}
                            type="primary"
                            icon="checkmark-circle"
                        />
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '60%',
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
        marginBottom: 32,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    footer: {
        width: '100%',
    },
});

export default StopSelectionModal;
