import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const UpdateModal = ({ visible, updateInfo, onUpdate, onCancel, isDownloading, progress }) => {
    if (!updateInfo) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={isDownloading ? () => { } : onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="rocket" size={32} color={Colors.text} />
                    </View>

                    <Text style={styles.title}>Update Available! 🚀</Text>
                    <Text style={styles.version}>v{updateInfo.version}</Text>

                    <ScrollView style={styles.notesContainer}>
                        <Text style={styles.notesTitle}>What's New:</Text>
                        <Text style={styles.notesText}>
                            {updateInfo.releaseNotes || 'Bug fixes and performance improvements.'}
                        </Text>
                    </ScrollView>

                    {isDownloading ? (
                        <View style={styles.progressContainer}>
                            <Text style={styles.progressText}>Downloading update... {Math.round(progress * 100)}%</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelText}>Later</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.updateButton]}
                                onPress={onUpdate}
                            >
                                <Text style={styles.updateText}>Update Now</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.overlayDark,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: `${Colors.primary}40`,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    version: {
        fontSize: 16,
        color: Colors.primaryLight,
        fontWeight: '600',
        marginBottom: 20,
        backgroundColor: `${Colors.primary}15`,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    notesContainer: {
        width: '100%',
        maxHeight: 150,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    notesTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notesText: {
        fontSize: 15,
        color: Colors.text,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.backgroundTertiary,
    },
    updateButton: {
        backgroundColor: Colors.success,
    },
    cancelText: {
        color: Colors.textSecondary,
        fontWeight: '600',
        fontSize: 16,
    },
    updateText: {
        color: Colors.text,
        fontWeight: '700',
        fontSize: 16,
    },
    progressContainer: {
        width: '100%',
        marginTop: 10,
    },
    progressText: {
        color: Colors.textSecondary,
        marginBottom: 8,
        fontSize: 14,
        textAlign: 'center',
    },
    progressBar: {
        height: 8,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.success,
        borderRadius: 4,
    },
});

export default UpdateModal;
