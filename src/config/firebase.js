import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure strict key usage
const firebaseConfig = {
    apiKey: "AIzaSyAU8P1iEQbetZtx3lleqmyKMCXmJTeSMDk",
    authDomain: "bus-qr-e7c4d.firebaseapp.com",
    projectId: "bus-qr-e7c4d",
    storageBucket: "bus-qr-e7c4d.firebasestorage.app",
    messagingSenderId: "561763979660",
    appId: "1:561763979660:web:ae2988149fc7d84cf186a9",
    measurementId: "G-21K6N9074M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
// We use a try-catch to fallback to getAuth if initializeAuth fails (e.g. if already initialized)
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (e) {
    // If auth is already initialized, get the existing instance
    auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };