import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePullDownGesture, GestureState } from '../hooks/usePullDownGesture';
import { Colors } from '../../../constants/colors';

const ScannerSheet = ({
    children,
    onScanSuccess = () => { },
    onClose = () => { }
}) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const {
        panResponder,
        translateY,
        opacity,
        scale,
        openScanner,
        closeScanner,
        triggerHaptic,
        sheetHeight
    } = usePullDownGesture({
        onActivate: () => setIsOpen(true),
        onDeactivate: () => {
            setIsOpen(false);
            setScanned(false);
            onClose();
        },
        onStateChange: (state) => {
            console.log('Gesture state:', state);
        }
    });

    // Request camera permission when scanner opens
    useEffect(() => {
        if (isOpen && !permission?.granted) {
            requestPermission();
        }
    }, [isOpen, permission]);

    const handleBarCodeScanned = useCallback(({ type, data }) => {
        if (scanned) return;

        setScanned(true);
        triggerHaptic('success');

        // Validate QR data
        try {
            // Try to parse as JSON for structured data
            let parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch {
                parsedData = { raw: data };
            }

            // Call success callback
            onScanSuccess({
                type,
                data,
                parsed: parsedData,
                timestamp: new Date().toISOString()
            });

            // Close scanner after short delay
            setTimeout(() => {
                closeScanner();
            }, 500);

        } catch (error) {
            triggerHaptic('error');
            Alert.alert('Invalid QR Code', 'Could not process this QR code.');
            setScanned(false);
        }
    }, [scanned, onScanSuccess, closeScanner, triggerHaptic]);

    const handleManualClose = () => {
        closeScanner();
    };

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            {/* Main Content (children) */}
            <View style={styles.content}>
                {children}
            </View>

            {/* Pull Indicator (always visible at top) */}
            <View style={styles.pullIndicator}>
                <View style={styles.pullBar} />
                <Text style={styles.pullHint}>Pull down to scan</Text>
            </View>

            {/* Scanner Sheet (animated) */}
            <Animated.View
                style={[
                    styles.scannerSheet,
                    {
                        height: sheetHeight,
                        transform: [
                            { translateY: Animated.subtract(translateY, sheetHeight) }
                        ],
                        opacity
                    }
                ]}
            >
                <BlurView intensity={90} style={styles.blurContainer} tint="dark">
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={handleManualClose}>
                        <Ionicons name="close" size={28} color={Colors.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Scan QR Code</Text>
                        <Text style={styles.subtitle}>Point camera at the bus QR code</Text>
                    </View>

                    {/* Camera View */}
                    <Animated.View style={[styles.cameraContainer, { transform: [{ scale }] }]}>
                        {permission?.granted ? (
                            <CameraView
                                style={styles.camera}
                                facing="back"
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr', 'code128', 'ean13']
                                }}
                                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            >
                                {/* Scan Frame Overlay */}
                                <View style={styles.scanFrame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                </View>

                                {/* Scanning Line Animation */}
                                {!scanned && (
                                    <Animated.View style={styles.scanLine} />
                                )}

                                {/* Scanned Indicator */}
                                {scanned && (
                                    <View style={styles.scannedOverlay}>
                                        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
                                        <Text style={styles.scannedText}>Scanned!</Text>
                                    </View>
                                )}
                            </CameraView>
                        ) : (
                            <View style={styles.permissionRequired}>
                                <Ionicons name="camera-outline" size={48} color={Colors.textSecondary} />
                                <Text style={styles.permissionText}>Camera permission required</Text>
                                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>

                    {/* Scan Again Button */}
                    {scanned && (
                        <TouchableOpacity
                            style={styles.scanAgainButton}
                            onPress={() => setScanned(false)}
                        >
                            <Ionicons name="refresh" size={20} color={Colors.primary} />
                            <Text style={styles.scanAgainText}>Scan Again</Text>
                        </TouchableOpacity>
                    )}
                </BlurView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    content: {
        flex: 1
    },
    pullIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
    },
    pullBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    pullHint: {
        marginTop: 4,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)'
    },
    scannerSheet: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
        zIndex: 100
    },
    blurContainer: {
        flex: 1,
        padding: 20
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    header: {
        marginTop: 50,
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4
    },
    cameraContainer: {
        flex: 1,
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000'
    },
    camera: {
        flex: 1
    },
    scanFrame: {
        position: 'absolute',
        top: '20%',
        left: '15%',
        right: '15%',
        bottom: '20%'
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: Colors.primary,
        borderWidth: 3
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    scanLine: {
        position: 'absolute',
        left: '15%',
        right: '15%',
        height: 2,
        backgroundColor: Colors.primary
    },
    scannedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    scannedText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.success,
        marginTop: 12
    },
    permissionRequired: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundSecondary
    },
    permissionText: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 16
    },
    permissionButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: 12
    },
    permissionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff'
    },
    scanAgainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12
    },
    scanAgainText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary
    }
});

export default ScannerSheet;
