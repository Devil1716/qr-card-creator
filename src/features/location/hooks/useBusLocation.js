import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import routePrediction from '../services/RoutePrediction';

/**
 * Hook that combines live bus location with route-based prediction
 * Provides the best available location at all times
 */
export const useBusLocation = (busId = null) => {
    const [liveLocation, setLiveLocation] = useState(null);
    const [predictedLocation, setPredictedLocation] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [status, setStatus] = useState('loading'); // loading, live, estimated, offline

    // Consider location stale after 60 seconds
    const STALE_THRESHOLD = 60 * 1000;

    // Listen to live bus location from Firestore
    useEffect(() => {
        if (!busId) {
            setLiveLocation(null);
            setIsLive(false);
            return;
        }

        const busQuery = query(
            collection(db, 'bus_locations'),
            where('isActive', '==', true),
            where('busId', '==', busId)
        );

        const unsubscribe = onSnapshot(busQuery, (snapshot) => {
            if (!snapshot.empty) {
                const busData = snapshot.docs[0].data();
                const updateTime = busData.updatedAt?.toDate?.() || new Date();

                setLiveLocation({
                    latitude: busData.latitude,
                    longitude: busData.longitude,
                    accuracy: busData.accuracy
                });
                setLastUpdate(updateTime);
                setIsLive(true);
            } else {
                setLiveLocation(null);
                setIsLive(false);
            }
        }, (error) => {
            console.log('Firestore offline or error:', error.code);
            // On error (likely offline), we'll rely on prediction
            setIsLive(false);
        });

        return () => unsubscribe();
    }, [busId]);

    // Update predicted location periodically
    useEffect(() => {
        const updatePrediction = () => {
            const prediction = routePrediction.getEstimatedPosition();
            setPredictedLocation(prediction);
        };

        updatePrediction();
        const interval = setInterval(updatePrediction, 30000); // Update every 30s

        return () => clearInterval(interval);
    }, []);

    // Determine current status and whether live data is stale
    useEffect(() => {
        if (liveLocation && lastUpdate) {
            const age = Date.now() - lastUpdate.getTime();
            if (age < STALE_THRESHOLD) {
                setStatus('live');
            } else {
                setStatus('estimated'); // Live data is stale, using prediction
            }
        } else if (predictedLocation?.isOperating) {
            setStatus('estimated');
        } else {
            setStatus('offline');
        }
    }, [liveLocation, lastUpdate, predictedLocation]);

    // Get the best available location
    const getBestLocation = useCallback(() => {
        // Prefer live if fresh
        if (status === 'live' && liveLocation) {
            return {
                ...liveLocation,
                source: 'live',
                confidence: liveLocation.accuracy < 50 ? 0.95 : 0.8
            };
        }

        // Fall back to prediction
        if (predictedLocation?.isOperating && predictedLocation.position) {
            return {
                latitude: predictedLocation.position.latitude,
                longitude: predictedLocation.position.longitude,
                source: 'estimated',
                confidence: predictedLocation.confidence
            };
        }

        return null;
    }, [status, liveLocation, predictedLocation]);

    return {
        // Combined location (best available)
        location: getBestLocation(),

        // Individual sources
        liveLocation,
        predictedLocation,

        // Status info
        status, // 'live', 'estimated', 'offline', 'loading'
        isLive: status === 'live',
        isOperating: predictedLocation?.isOperating || isLive,

        // Additional context
        lastUpdate,
        nextStop: predictedLocation?.nextStop,
        eta: predictedLocation?.etaText,
        tripType: predictedLocation?.tripType,

        // Route info
        routePath: routePrediction.getRoutePath(),
        stops: routePrediction.getStops()
    };
};

export default useBusLocation;
