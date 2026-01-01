import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Conditionally import AsyncStorage for React Native environment
let AsyncStorage;
if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    try {
        AsyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
        console.warn('AsyncStorage not found');
    }
}

const firebaseConfig = {
    apiKey: "AIzaSyAU8P1iEQbetZtx3lleqmyKMCXmJTeSMDk",
    authDomain: "bus-qr-e7c4d.firebaseapp.com",
    projectId: "bus-qr-e7c4d",
    storageBucket: "bus-qr-e7c4d.firebasestorage.app",
    messagingSenderId: "561763979660",
    appId: "1:561763979660:web:ae2988149fc7d84cf186a9",
    measurementId: "G-21K6N9074M"
};

let app;
let auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    if (AsyncStorage) {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
        });
    } else {
        // Fallback for Node.js scripts or web without AsyncStorage
        auth = getAuth(app);
    }
} else {
    app = getApp();
    auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };