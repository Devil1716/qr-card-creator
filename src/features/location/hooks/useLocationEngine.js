import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { AppState, Platform } from 'react-native';
import KalmanFilter from '../utils/KalmanFilter';

/**
 * Battery-optimized location tracking modes
 */
export const LocationMode = {
    ACTIVE: 'active',           // 1s GPS, 50Hz sensors
    BACKGROUND: 'background',   // 30s GPS, 10Hz sensors
    STATIONARY: 'stationary',   // 5min GPS, 1Hz sensors
    OFF: 'off'
};

/**
 * Accuracy levels for confidence ring visualization
 */
export const AccuracyLevel = {
    HIGH: 'high',         // < 10m
    MEDIUM: 'medium',     // 10-50m
    LOW: 'low',           // 50-100m
    DEGRADED: 'degraded'  // > 100m
};

const getAccuracyLevel = (accuracy) => {
    if (accuracy < 10) return AccuracyLevel.HIGH;
    if (accuracy < 50) return AccuracyLevel.MEDIUM;
    if (accuracy < 100) return AccuracyLevel.LOW;
    return AccuracyLevel.DEGRADED;
};

const ACCURACY_COLORS = {
    [AccuracyLevel.HIGH]: '#22C55E',
    [AccuracyLevel.MEDIUM]: '#EAB308',
    [AccuracyLevel.LOW]: '#F97316',
    [AccuracyLevel.DEGRADED]: '#EF4444'
};

/**
 * Hybrid location engine with sensor fusion
 */
export const useLocationEngine = (options = {}) => {
    const {
        mode = LocationMode.ACTIVE,
        enableSensorFusion = true,
        onLocationUpdate = null
    } = options;

    const [location, setLocation] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [accuracyLevel, setAccuracyLevel] = useState(AccuracyLevel.DEGRADED);
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState(null);

    const kalmanFilter = useRef(new KalmanFilter());
    const locationSubscription = useRef(null);
    const sensorSubscriptions = useRef({});
    const lastGPSTime = useRef(null);
    const imuData = useRef({ acc_x: 0, acc_y: 0, heading: 0 });
    const predictionInterval = useRef(null);

    // Get GPS intervals based on mode
    const getGPSInterval = useCallback(() => {
        switch (mode) {
            case LocationMode.ACTIVE: return 1000;
            case LocationMode.BACKGROUND: return 30000;
            case LocationMode.STATIONARY: return 300000;
            default: return 30000;
        }
    }, [mode]);

    // Get sensor update interval based on mode
    const getSensorInterval = useCallback(() => {
        switch (mode) {
            case LocationMode.ACTIVE: return 20;  // 50Hz
            case LocationMode.BACKGROUND: return 100;  // 10Hz
            case LocationMode.STATIONARY: return 1000;  // 1Hz
            default: return 100;
        }
    }, [mode]);

    // Start GPS tracking
    const startGPSTracking = useCallback(async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission denied');
                return false;
            }

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: getGPSInterval(),
                    distanceInterval: 1
                },
                (newLocation) => {
                    const { latitude, longitude, accuracy: gpsAccuracy } = newLocation.coords;

                    // Update Kalman filter
                    if (!kalmanFilter.current.lastUpdate) {
                        kalmanFilter.current.reset(latitude, longitude);
                    } else {
                        kalmanFilter.current.updateGPS(latitude, longitude, gpsAccuracy);
                    }

                    lastGPSTime.current = Date.now();
                    updateEstimate();
                }
            );

            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    }, [getGPSInterval]);

    // Start sensor tracking
    const startSensorTracking = useCallback(() => {
        const interval = getSensorInterval();

        Accelerometer.setUpdateInterval(interval);
        Gyroscope.setUpdateInterval(interval);
        Magnetometer.setUpdateInterval(interval);

        sensorSubscriptions.current.accelerometer = Accelerometer.addListener(data => {
            // Convert to m/s² (remove gravity, use device orientation)
            imuData.current.acc_x = data.x * 9.81;
            imuData.current.acc_y = data.y * 9.81;
        });

        sensorSubscriptions.current.magnetometer = Magnetometer.addListener(data => {
            // Calculate heading from magnetometer
            imuData.current.heading = Math.atan2(data.y, data.x);
        });
    }, [getSensorInterval]);

    // Update estimated position
    const updateEstimate = useCallback(() => {
        const estimate = kalmanFilter.current.getEstimate();

        const newLocation = {
            latitude: estimate.lat,
            longitude: estimate.lon,
            velocity: estimate.velocity
        };

        setLocation(newLocation);
        setAccuracy(estimate.accuracy);
        setAccuracyLevel(getAccuracyLevel(estimate.accuracy));

        if (onLocationUpdate) {
            onLocationUpdate({
                ...newLocation,
                accuracy: estimate.accuracy,
                accuracyLevel: getAccuracyLevel(estimate.accuracy),
                color: ACCURACY_COLORS[getAccuracyLevel(estimate.accuracy)]
            });
        }
    }, [onLocationUpdate]);

    // Prediction loop (runs when GPS is unavailable)
    const startPredictionLoop = useCallback(() => {
        let lastTime = Date.now();

        predictionInterval.current = setInterval(() => {
            const now = Date.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            // Only predict if we haven't had GPS in a while
            if (lastGPSTime.current && (now - lastGPSTime.current) > 2000) {
                kalmanFilter.current.predict(dt, enableSensorFusion ? imuData.current : null);
                updateEstimate();
            }
        }, 100); // 10Hz prediction
    }, [enableSensorFusion, updateEstimate]);

    // Start tracking
    const startTracking = useCallback(async () => {
        if (mode === LocationMode.OFF) return;

        const gpsStarted = await startGPSTracking();
        if (!gpsStarted) return;

        if (enableSensorFusion) {
            startSensorTracking();
        }

        startPredictionLoop();
        setIsTracking(true);
        setError(null);
    }, [mode, enableSensorFusion, startGPSTracking, startSensorTracking, startPredictionLoop]);

    // Stop tracking
    const stopTracking = useCallback(() => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }

        Object.values(sensorSubscriptions.current).forEach(sub => sub?.remove());
        sensorSubscriptions.current = {};

        if (predictionInterval.current) {
            clearInterval(predictionInterval.current);
            predictionInterval.current = null;
        }

        setIsTracking(false);
    }, []);

    // Handle app state changes for battery optimization
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'background' && mode === LocationMode.ACTIVE) {
                // Reduce tracking intensity when app is backgrounded
                stopTracking();
            } else if (nextAppState === 'active' && !isTracking) {
                startTracking();
            }
        });

        return () => subscription?.remove();
    }, [mode, isTracking, startTracking, stopTracking]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopTracking();
    }, [stopTracking]);

    return {
        location,
        accuracy,
        accuracyLevel,
        accuracyColor: ACCURACY_COLORS[accuracyLevel],
        isTracking,
        error,
        startTracking,
        stopTracking,
        resetFilter: () => {
            if (location) {
                kalmanFilter.current.reset(location.latitude, location.longitude);
            }
        }
    };
};

export default useLocationEngine;
