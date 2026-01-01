import { useRef, useCallback } from 'react';
import { Animated, PanResponder, Dimensions, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Gesture configuration
 */
const GESTURE_CONFIG = {
    triggerZoneHeight: 80,           // px from top
    activationThreshold: 100,        // px distance to activate
    velocityThreshold: 800,          // px/s for quick swipe
    rubberBandFactor: 0.5,           // overscroll resistance
    snapAnimationDuration: 300,      // ms
    sheetHeight: SCREEN_HEIGHT * 0.6 // Scanner sheet height
};

/**
 * States for the gesture state machine
 */
export const GestureState = {
    IDLE: 'idle',
    TRACKING: 'tracking',
    COMMITTED: 'committed',
    SCANNER_OPEN: 'scanner_open',
    CARD_PREVIEW: 'card_preview'
};

/**
 * Custom hook for pull-down gesture recognition
 */
export const usePullDownGesture = (options = {}) => {
    const {
        onActivate = () => { },
        onDeactivate = () => { },
        onStateChange = () => { }
    } = options;

    // Animation values
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    // State tracking
    const gestureState = useRef(GestureState.IDLE);
    const startY = useRef(0);
    const hasActivated = useRef(false);

    /**
     * Haptic feedback based on platform
     */
    const triggerHaptic = useCallback(async (type = 'medium') => {
        try {
            if (Platform.OS === 'ios') {
                switch (type) {
                    case 'light':
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        break;
                    case 'medium':
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        break;
                    case 'heavy':
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        break;
                    case 'success':
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        break;
                    case 'error':
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        break;
                }
            } else {
                // Android vibration pattern
                switch (type) {
                    case 'light':
                        Vibration.vibrate(10);
                        break;
                    case 'medium':
                        Vibration.vibrate(25);
                        break;
                    case 'heavy':
                        Vibration.vibrate(50);
                        break;
                    case 'success':
                        Vibration.vibrate([0, 50, 50, 50]);
                        break;
                    case 'error':
                        Vibration.vibrate([0, 100, 50, 100]);
                        break;
                }
            }
        } catch (e) {
            // Haptics not available
        }
    }, []);

    /**
     * Animate to open state
     */
    const openScanner = useCallback(() => {
        gestureState.current = GestureState.SCANNER_OPEN;
        onStateChange(GestureState.SCANNER_OPEN);

        Animated.parallel([
            Animated.spring(translateY, {
                toValue: GESTURE_CONFIG.sheetHeight,
                useNativeDriver: true,
                tension: 50,
                friction: 10
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: GESTURE_CONFIG.snapAnimationDuration,
                useNativeDriver: true
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 10
            })
        ]).start();

        triggerHaptic('success');
        onActivate();
    }, [translateY, opacity, scale, onActivate, onStateChange, triggerHaptic]);

    /**
     * Animate to closed state
     */
    const closeScanner = useCallback(() => {
        gestureState.current = GestureState.IDLE;
        onStateChange(GestureState.IDLE);
        hasActivated.current = false;

        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 10
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: GESTURE_CONFIG.snapAnimationDuration,
                useNativeDriver: true
            }),
            Animated.spring(scale, {
                toValue: 0.95,
                useNativeDriver: true,
                tension: 50,
                friction: 10
            })
        ]).start();

        onDeactivate();
    }, [translateY, opacity, scale, onDeactivate, onStateChange]);

    /**
     * PanResponder configuration
     */
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (evt) => {
                // Only activate in trigger zone (top of screen)
                return evt.nativeEvent.pageY < GESTURE_CONFIG.triggerZoneHeight;
            },

            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Activate on downward movement in trigger zone
                return (
                    evt.nativeEvent.pageY < GESTURE_CONFIG.triggerZoneHeight * 2 &&
                    gestureState.dy > 10
                );
            },

            onPanResponderGrant: (evt) => {
                startY.current = evt.nativeEvent.pageY;
                gestureState.current = GestureState.TRACKING;
                onStateChange(GestureState.TRACKING);
            },

            onPanResponderMove: (evt, gesture) => {
                const dy = gesture.dy;

                // Apply rubber band effect
                let newY;
                if (dy > GESTURE_CONFIG.sheetHeight) {
                    // Overscroll resistance
                    const excess = dy - GESTURE_CONFIG.sheetHeight;
                    newY = GESTURE_CONFIG.sheetHeight + (excess * GESTURE_CONFIG.rubberBandFactor);
                } else {
                    newY = Math.max(0, dy);
                }

                translateY.setValue(newY);

                // Calculate opacity and scale based on progress
                const progress = Math.min(1, dy / GESTURE_CONFIG.activationThreshold);
                opacity.setValue(progress);
                scale.setValue(0.95 + (0.05 * progress));

                // Trigger haptic at activation threshold
                if (dy >= GESTURE_CONFIG.activationThreshold && !hasActivated.current) {
                    hasActivated.current = true;
                    gestureState.current = GestureState.COMMITTED;
                    onStateChange(GestureState.COMMITTED);
                    triggerHaptic('medium');
                }
            },

            onPanResponderRelease: (evt, gesture) => {
                const { dy, vy } = gesture;

                // Check if should open (velocity or distance based)
                const shouldOpen =
                    dy >= GESTURE_CONFIG.activationThreshold ||
                    vy > GESTURE_CONFIG.velocityThreshold / 1000;

                if (shouldOpen) {
                    openScanner();
                } else {
                    closeScanner();
                }
            },

            onPanResponderTerminate: () => {
                closeScanner();
            }
        })
    ).current;

    return {
        panResponder,
        translateY,
        opacity,
        scale,
        gestureState: gestureState.current,
        openScanner,
        closeScanner,
        triggerHaptic,
        sheetHeight: GESTURE_CONFIG.sheetHeight
    };
};

export default usePullDownGesture;
