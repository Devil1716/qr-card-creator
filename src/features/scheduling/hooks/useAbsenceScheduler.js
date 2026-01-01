import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

const ABSENCES_KEY = '@scheduled_absences';

/**
 * Absence types
 */
export const AbsenceType = {
    HOLIDAY: 'holiday',
    SICK: 'sick',
    OTHER: 'other'
};

/**
 * Recurrence patterns
 */
export const RecurrencePattern = {
    NONE: 'none',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

/**
 * Generate unique ID (ULID-like)
 */
const generateId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
};

/**
 * Hook for managing absence scheduling
 */
export const useAbsenceScheduler = () => {
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error

    /**
     * Load absences from local storage
     */
    const loadLocalAbsences = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(ABSENCES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading absences:', error);
            return [];
        }
    }, []);

    /**
     * Save absences to local storage
     */
    const saveLocalAbsences = useCallback(async (data) => {
        try {
            await AsyncStorage.setItem(ABSENCES_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving absences:', error);
        }
    }, []);

    /**
     * Create a new absence record
     */
    const createAbsence = useCallback(async (absenceData) => {
        const newAbsence = {
            id: generateId(),
            userId: auth.currentUser?.uid,
            type: absenceData.type || AbsenceType.HOLIDAY,
            startDate: absenceData.startDate,
            endDate: absenceData.endDate,
            recurrence: absenceData.recurrence || null,
            affectedTrips: absenceData.affectedTrips || ['morning', 'evening'],
            notifyDriver: absenceData.notifyDriver !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending'
        };

        // Add to local state
        const updated = [...absences, newAbsence];
        setAbsences(updated);
        await saveLocalAbsences(updated);

        // Sync to Firebase
        syncToFirebase(newAbsence);

        return newAbsence;
    }, [absences, saveLocalAbsences]);

    /**
     * Update an existing absence
     */
    const updateAbsence = useCallback(async (id, updates) => {
        const updated = absences.map(a => {
            if (a.id === id) {
                return {
                    ...a,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                    syncStatus: 'pending'
                };
            }
            return a;
        });

        setAbsences(updated);
        await saveLocalAbsences(updated);

        const updatedAbsence = updated.find(a => a.id === id);
        if (updatedAbsence) {
            syncToFirebase(updatedAbsence);
        }
    }, [absences, saveLocalAbsences]);

    /**
     * Delete an absence
     */
    const deleteAbsence = useCallback(async (id) => {
        const updated = absences.filter(a => a.id !== id);
        setAbsences(updated);
        await saveLocalAbsences(updated);

        // TODO: Mark as deleted in Firebase instead of actual delete
    }, [absences, saveLocalAbsences]);

    /**
     * Sync absence to Firebase
     */
    const syncToFirebase = useCallback(async (absence) => {
        if (!auth.currentUser) return;

        setSyncStatus('syncing');

        try {
            const docRef = doc(db, 'absences', absence.id);
            await setDoc(docRef, {
                ...absence,
                syncStatus: 'synced'
            }, { merge: true });

            // Update local sync status
            setAbsences(prev => prev.map(a =>
                a.id === absence.id ? { ...a, syncStatus: 'synced' } : a
            ));

            setSyncStatus('synced');
        } catch (error) {
            console.error('Error syncing absence:', error);
            setSyncStatus('error');
        }
    }, []);

    /**
     * Get absences for a specific date range
     */
    const getAbsencesInRange = useCallback((startDate, endDate) => {
        return absences.filter(a => {
            const aStart = new Date(a.startDate);
            const aEnd = new Date(a.endDate);
            const rangeStart = new Date(startDate);
            const rangeEnd = new Date(endDate);

            // Check if ranges overlap
            return aStart <= rangeEnd && aEnd >= rangeStart;
        });
    }, [absences]);

    /**
     * Check if a specific date has an absence
     */
    const isDateAbsent = useCallback((date) => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        return absences.some(a => {
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (checkDate >= start && checkDate <= end) {
                return true;
            }

            // Check recurring patterns
            if (a.recurrence) {
                return checkRecurrence(checkDate, a);
            }

            return false;
        });
    }, [absences]);

    /**
     * Check if date matches recurrence pattern
     */
    const checkRecurrence = (date, absence) => {
        if (!absence.recurrence) return false;

        const { pattern, daysOfWeek, dayOfMonth } = absence.recurrence;
        const dayOfWeekNum = date.getDay();
        const dayOfMonthNum = date.getDate();

        switch (pattern) {
            case RecurrencePattern.WEEKLY:
                return daysOfWeek?.includes(dayOfWeekNum);
            case RecurrencePattern.MONTHLY:
                return dayOfMonth === dayOfMonthNum;
            default:
                return false;
        }
    };

    /**
     * Get smart suggestions based on history
     */
    const getSuggestions = useCallback(() => {
        const suggestions = [];

        // Analyze patterns in existing absences
        const dayOfWeekCounts = {};
        absences.forEach(a => {
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);

            // Count days of week
            let current = new Date(start);
            while (current <= end) {
                const dow = current.getDay();
                dayOfWeekCounts[dow] = (dayOfWeekCounts[dow] || 0) + 1;
                current.setDate(current.getDate() + 1);
            }
        });

        // Suggest weekly pattern if a day appears frequently
        Object.entries(dayOfWeekCounts).forEach(([day, count]) => {
            if (count >= 3) {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                suggestions.push({
                    type: 'weekly',
                    description: `You often skip ${dayNames[day]}s`,
                    action: {
                        recurrence: {
                            pattern: RecurrencePattern.WEEKLY,
                            daysOfWeek: [parseInt(day)]
                        }
                    }
                });
            }
        });

        return suggestions;
    }, [absences]);

    // Load absences on mount
    useEffect(() => {
        const init = async () => {
            const local = await loadLocalAbsences();
            setAbsences(local);
            setLoading(false);
        };
        init();
    }, [loadLocalAbsences]);

    // Listen to Firebase for real-time updates
    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'absences'),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const firebaseAbsences = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            // Merge with local (CRDT-like: last-write-wins)
            setAbsences(prev => {
                const merged = [...prev];

                firebaseAbsences.forEach(fa => {
                    const localIndex = merged.findIndex(m => m.id === fa.id);
                    if (localIndex === -1) {
                        merged.push(fa);
                    } else {
                        // Last-write-wins
                        const local = merged[localIndex];
                        if (new Date(fa.updatedAt) > new Date(local.updatedAt)) {
                            merged[localIndex] = fa;
                        }
                    }
                });

                return merged;
            });
        });

        return () => unsubscribe();
    }, []);

    return {
        absences,
        loading,
        syncStatus,
        createAbsence,
        updateAbsence,
        deleteAbsence,
        getAbsencesInRange,
        isDateAbsent,
        getSuggestions
    };
};

export default useAbsenceScheduler;
