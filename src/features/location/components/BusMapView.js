import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocationEngine, LocationMode, AccuracyLevel } from '../hooks/useLocationEngine';
import { Colors } from '../../../constants/colors';

const ACCURACY_COLORS = {
    [AccuracyLevel.HIGH]: '#22C55E',
    [AccuracyLevel.MEDIUM]: '#EAB308',
    [AccuracyLevel.LOW]: '#F97316',
    [AccuracyLevel.DEGRADED]: '#EF4444'
};

const BusMapView = ({
    isDriver = false,
    busRoute = null,
    otherBuses = [],
    onLocationUpdate = null,
    style = {}
}) => {
    const mapRef = useRef(null);
    const [isFollowing, setIsFollowing] = useState(true);
    const [showAccuracyRing, setShowAccuracyRing] = useState(true);

    const {
        location,
        accuracy,
        accuracyLevel,
        accuracyColor,
        isTracking,
        error,
        startTracking,
        stopTracking
    } = useLocationEngine({
        mode: isDriver ? LocationMode.ACTIVE : LocationMode.BACKGROUND,
        enableSensorFusion: true,
        onLocationUpdate
    });

    // Center map on location when following
    useEffect(() => {
        if (location && isFollowing && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            }, 500);
        }
    }, [location, isFollowing]);

    // Start tracking on mount
    useEffect(() => {
        startTracking();
        return () => stopTracking();
    }, []);

    const handleMapDrag = () => {
        setIsFollowing(false);
    };

    const handleRecenter = () => {
        setIsFollowing(true);
    };

    const getAccuracyText = () => {
        if (!accuracy) return 'Acquiring...';
        if (accuracy < 10) return `±${accuracy.toFixed(0)}m (Excellent)`;
        if (accuracy < 50) return `±${accuracy.toFixed(0)}m (Good)`;
        if (accuracy < 100) return `±${accuracy.toFixed(0)}m (Fair)`;
        return `±${accuracy.toFixed(0)}m (Poor)`;
    };

    return (
        <View style={[styles.container, style]}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={{
                    latitude: location?.latitude || 28.6139,
                    longitude: location?.longitude || 77.2090,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                }}
                showsUserLocation={false} // We render custom marker
                showsMyLocationButton={false}
                onPanDrag={handleMapDrag}
                mapType="standard"
            >
                {/* User/Bus Position with Accuracy Ring */}
                {location && (
                    <>
                        {/* Accuracy confidence ring */}
                        {showAccuracyRing && accuracy > 0 && (
                            <Circle
                                center={{
                                    latitude: location.latitude,
                                    longitude: location.longitude
                                }}
                                radius={accuracy}
                                fillColor={`${accuracyColor}20`}
                                strokeColor={`${accuracyColor}60`}
                                strokeWidth={2}
                            />
                        )}

                        {/* Position marker */}
                        <Marker
                            coordinate={{
                                latitude: location.latitude,
                                longitude: location.longitude
                            }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={[styles.markerContainer, { borderColor: accuracyColor }]}>
                                <Ionicons
                                    name={isDriver ? "bus" : "person"}
                                    size={20}
                                    color={Colors.text}
                                />
                            </View>
                        </Marker>
                    </>
                )}

                {/* Bus Route Polyline */}
                {busRoute && busRoute.coordinates && (
                    <Polyline
                        coordinates={busRoute.coordinates}
                        strokeColor={Colors.primary}
                        strokeWidth={4}
                        lineDashPattern={[1]}
                    />
                )}

                {/* Other buses (for students viewing driver positions) */}
                {otherBuses.map((bus, index) => (
                    <Marker
                        key={bus.id || index}
                        coordinate={{
                            latitude: bus.latitude,
                            longitude: bus.longitude
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.busMarker}>
                            <Ionicons name="bus" size={16} color="#fff" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Accuracy Indicator */}
            <View style={styles.accuracyBadge}>
                <View style={[styles.accuracyDot, { backgroundColor: accuracyColor }]} />
                <Text style={styles.accuracyText}>{getAccuracyText()}</Text>
            </View>

            {/* Recenter Button */}
            {!isFollowing && location && (
                <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                    <Ionicons name="locate" size={24} color={Colors.primary} />
                </TouchableOpacity>
            )}

            {/* Toggle Accuracy Ring */}
            <TouchableOpacity
                style={styles.toggleRingButton}
                onPress={() => setShowAccuracyRing(!showAccuracyRing)}
            >
                <Ionicons
                    name={showAccuracyRing ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={Colors.textSecondary}
                />
            </TouchableOpacity>

            {/* Error Display */}
            {error && (
                <View style={styles.errorBanner}>
                    <Ionicons name="warning" size={16} color="#fff" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Colors.backgroundSecondary
    },
    map: {
        flex: 1
    },
    markerContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.backgroundSecondary,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    busMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    accuracyBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 15, 26, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8
    },
    accuracyDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    accuracyText: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: '600'
    },
    recenterButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5
    },
    toggleRingButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(15, 15, 26, 0.9)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    errorBanner: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.95)',
        paddingVertical: 10
    },
    errorText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500'
    }
});

export default BusMapView;
