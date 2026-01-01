import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Config from src/config/firebase.js
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
const auth = getAuth(app);
const db = getFirestore(app);

const createDriver = async () => {
    const email = "driverr8@r8.bus";
    const password = "password123";
    const name = "Main Driver";

    console.log(`Creating driver account: ${email}...`);

    try {
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Auth user created:", user.uid);

        // 2. Update Profile
        await updateProfile(user, { displayName: name });
        console.log("Profile updated");

        // 3. Create Firestore Doc
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            role: "driver",
            createdAt: new Date().toISOString(),
            busId: "KA-01-F-1234",
            isActive: true
        });
        console.log("Firestore document created with role 'driver'");

        console.log("\nSUCCESS! Driver account created.");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("\nUser already exists. Creating/Updating Firestore doc anyway...");
            // Use a workaround to find the user if we can't login, 
            // BUT simpler: just ask to login if it exists. 
            // Or strictly, we just want to ensure the doc is there?
            // Without admin SDK we can't get UID by email easily directly unless we sign in.
            // Let's try to sign in.
            try {
                const { signInWithEmailAndPassword } = await import("firebase/auth");
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Logged in as existing user:", user.uid);

                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    role: "driver",
                    createdAt: new Date().toISOString(),
                    busId: "KA-01-F-1234",
                    isActive: true
                }, { merge: true });
                console.log("Firestore document updated.");
                process.exit(0);
            } catch (loginError) {
                console.error("Could not login to existing account. Password might differ?", loginError.message);
                process.exit(1);
            }
        } else {
            console.error("Error creating driver:", error);
            process.exit(1);
        }
    }
};

createDriver();
