import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} else {
    app = getApp();
    auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };