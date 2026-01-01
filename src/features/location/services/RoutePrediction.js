/**
 * Route-Based Prediction Service
 * Provides estimated bus position when live tracking is unavailable
 */

/**
 * Example route definition - these should be loaded from Firebase/config
 * Each stop has: id, name, coordinates, and scheduled arrival times (morning/evening)
 */
const SAMPLE_ROUTE = {
    id: 'route_blr_1',
    name: 'Nagasandra to Ramanashree',
    morningDeparture: '07:30',
    eveningDeparture: '16:00',
    stops: [
        { id: 'stop_1', name: 'Nagasandra', lat: 13.0431, lon: 77.5002, morningTime: '07:30', eveningTime: '16:00' },
        { id: 'stop_2', name: 'Dasarahalli', lat: 13.0438, lon: 77.5130, morningTime: '07:35', eveningTime: '16:05' },
        { id: 'stop_3', name: 'Jalahalli', lat: 13.0528, lon: 77.5200, morningTime: '07:40', eveningTime: '16:10' },
        { id: 'stop_4', name: 'Ayappa Temple', lat: 13.0580, lon: 77.5250, morningTime: '07:45', eveningTime: '16:15' },
        { id: 'stop_5', name: 'K G Halli', lat: 13.0545, lon: 77.5327, morningTime: '07:50', eveningTime: '16:20' },
        { id: 'stop_6', name: 'Gangamma Circle', lat: 13.0566, lon: 77.5466, morningTime: '07:55', eveningTime: '16:25' },
        { id: 'stop_7', name: 'M S Palya', lat: 13.0813, lon: 77.5538, morningTime: '08:00', eveningTime: '16:30' },
        { id: 'stop_8', name: 'Medical Shop', lat: 13.0880, lon: 77.5600, morningTime: '08:03', eveningTime: '16:33' },
        { id: 'stop_9', name: 'New Turn', lat: 13.0930, lon: 77.5650, morningTime: '08:06', eveningTime: '16:36' },
        { id: 'stop_10', name: 'Ashram', lat: 13.0980, lon: 77.5700, morningTime: '08:10', eveningTime: '16:40' },
        { id: 'stop_11', name: 'Transformer', lat: 13.1030, lon: 77.5750, morningTime: '08:13', eveningTime: '16:43' },
        { id: 'stop_12', name: 'Mrp Layout', lat: 13.1080, lon: 77.5800, morningTime: '08:16', eveningTime: '16:46' },
        { id: 'stop_13', name: 'Ramanashree', lat: 13.1166, lon: 77.5877, morningTime: '08:20', eveningTime: '16:50' },
    ]
};

/**
 * Parse time string to minutes since midnight
 */
const parseTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Get current time in minutes since midnight
 */
const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
};

/**
 * Interpolate position between two stops based on time
 */
const interpolatePosition = (stop1, stop2, progress) => {
    return {
        latitude: stop1.lat + (stop2.lat - stop1.lat) * progress,
        longitude: stop1.lon + (stop2.lon - stop1.lon) * progress
    };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

class RoutePrediction {
    constructor() {
        this.routes = new Map();
        this.activeRoute = null;
    }

    /**
     * Load route definition
     */
    setRoute(route = SAMPLE_ROUTE) {
        this.routes.set(route.id, route);
        this.activeRoute = route;
    }

    /**
     * Determine if it's morning or evening trip based on current time
     */
    getTripType() {
        const now = getCurrentMinutes();
        const noon = 12 * 60;
        return now < noon ? 'morning' : 'evening';
    }

    /**
     * Get estimated bus position based on schedule
     * Returns: { position, nextStop, eta, confidence, isOperating }
     */
    getEstimatedPosition(routeId = null) {
        const route = routeId ? this.routes.get(routeId) : this.activeRoute;
        if (!route || !route.stops || route.stops.length < 2) {
            return { isOperating: false, message: 'No route configured' };
        }

        const tripType = this.getTripType();
        const timeKey = tripType === 'morning' ? 'morningTime' : 'eveningTime';
        const currentMinutes = getCurrentMinutes();

        // Get stops sorted by scheduled time
        const stops = route.stops.map(stop => ({
            ...stop,
            scheduledMinutes: parseTimeToMinutes(stop[timeKey])
        })).sort((a, b) => a.scheduledMinutes - b.scheduledMinutes);

        const firstStopTime = stops[0].scheduledMinutes;
        const lastStopTime = stops[stops.length - 1].scheduledMinutes;

        // Check if bus is operating
        if (currentMinutes < firstStopTime - 10) {
            return {
                isOperating: false,
                message: 'Bus not yet departed',
                nextDeparture: stops[0][timeKey],
                nextStop: stops[0]
            };
        }

        if (currentMinutes > lastStopTime + 30) {
            return {
                isOperating: false,
                message: 'Trip completed',
                tripType
            };
        }

        // Find current segment (between which two stops)
        let prevStop = stops[0];
        let nextStop = stops[1];

        for (let i = 0; i < stops.length - 1; i++) {
            if (currentMinutes >= stops[i].scheduledMinutes &&
                currentMinutes < stops[i + 1].scheduledMinutes) {
                prevStop = stops[i];
                nextStop = stops[i + 1];
                break;
            }
            // If past all stops, use last segment
            if (i === stops.length - 2 && currentMinutes >= stops[i + 1].scheduledMinutes) {
                prevStop = stops[i + 1];
                nextStop = stops[i + 1];
            }
        }

        // Calculate progress between stops
        const segmentDuration = nextStop.scheduledMinutes - prevStop.scheduledMinutes;
        const elapsedInSegment = currentMinutes - prevStop.scheduledMinutes;
        const progress = segmentDuration > 0
            ? Math.min(1, Math.max(0, elapsedInSegment / segmentDuration))
            : 1;

        // Interpolate position
        const position = interpolatePosition(prevStop, nextStop, progress);

        // Calculate ETA to next stop
        const etaMinutes = Math.max(0, nextStop.scheduledMinutes - currentMinutes);

        // Confidence based on how predictable the route is
        // Lower confidence if we're relying purely on schedule
        const confidence = 0.6; // 60% confidence for schedule-based prediction

        return {
            isOperating: true,
            position,
            prevStop: { id: prevStop.id, name: prevStop.name },
            nextStop: { id: nextStop.id, name: nextStop.name },
            eta: etaMinutes,
            etaText: etaMinutes > 0 ? `${etaMinutes} min` : 'Arriving',
            progress, // 0-1 between stops
            confidence,
            tripType,
            isEstimated: true // Flag to indicate this is not live
        };
    }

    /**
     * Get all stops for the active route
     */
    getStops() {
        return this.activeRoute?.stops || [];
    }

    /**
     * Get the full route path for drawing on map
     */
    getRoutePath() {
        if (!this.activeRoute) return [];
        return this.activeRoute.stops.map(stop => ({
            latitude: stop.lat,
            longitude: stop.lon
        }));
    }

    /**
     * Calculate ETA from current position to a specific stop
     */
    getETAToStop(currentLat, currentLon, stopId) {
        const stop = this.activeRoute?.stops.find(s => s.id === stopId);
        if (!stop) return null;

        const distance = calculateDistance(currentLat, currentLon, stop.lat, stop.lon);
        // Assume average bus speed of 25 km/h in city
        const avgSpeed = 25 / 60; // km per minute
        const etaMinutes = Math.round(distance / 1000 / avgSpeed);

        return {
            distance: Math.round(distance),
            eta: etaMinutes,
            etaText: etaMinutes > 1 ? `${etaMinutes} min` : 'Less than 1 min'
        };
    }
}

// Singleton instance
const routePrediction = new RoutePrediction();
routePrediction.setRoute(SAMPLE_ROUTE);

export default routePrediction;
export { RoutePrediction, SAMPLE_ROUTE };
