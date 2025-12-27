import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const USERS_TO_SEED = [
    'krishay', 'satish', 'nithin', 'harshitha', 'bhuvana', 'renuka',
    'abhay', 'dhanyashree', 'deepthi', 'anjana', 'hithaishi', 'charitha',
    'utkarsh', 'manje', 'shrerya', 'sahana', 'niharika', 'nishanth',
    'nikhil', 'tanuja', 'punyashree', 'sharan'
];

/**
 * CAUTION: This function signs out the current user to create new ones!
 * It should be triggered manually and carefully.
 */
export const seedUsers = async (onProgress) => {
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Ensure we are signed out first
    try {
        await signOut(auth);
    } catch (e) {
        // Ignore if already signed out
    }

    for (const name of USERS_TO_SEED) {
        try {
            const cleanName = name.trim();
            const email = `${cleanName.toLowerCase().replace(/\s+/g, '')}@r8.bus`;
            const password = email; // Default password is same as email

            if (onProgress) onProgress(`Creating ${name}...`);

            // 1. Create User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Profile
            await updateProfile(user, { displayName: cleanName });

            // 3. Create Firestore Doc with FORCED PASSWORD CHANGE flag
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: cleanName,
                email: email,
                role: 'student',
                createdAt: new Date().toISOString(),
                requiresPasswordChange: true // <--- IMPORTANT
            });

            console.log(`✅ Seeded: ${name}`);
            successCount++;

            // 4. Sign out immediately to prepare for next loop
            // NOTE: createUser automatically signs in, so we must sign out.
            await signOut(auth);

        } catch (error) {
            console.error(`❌ Failed to seed ${name}:`, error.code);
            if (error.code === 'auth/email-already-in-use') {
                // If already exists, we might want to update the firestore doc anyway to ensure flag is set
                // But we can't get UID without logging in. Skip for now.
                errors.push(`${name}: Already exists`);
            } else {
                errors.push(`${name}: ${error.message}`);
            }
            failCount++;
        }
    }

    return { successCount, failCount, errors };
};
