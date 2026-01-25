import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigValid = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigValid) {
  if (!getApps().length) {
      app = initializeApp(firebaseConfig);
  } else {
      app = getApp();
  }
  
  if (app) {
    const databaseId = "drivercheck";
    try {
      db = getFirestore(app, databaseId);
    } catch (e) {
      try {
        db = initializeFirestore(app, { 
            experimentalForceLongPolling: true, 
            localCache: { kind: 'memory' } 
        }, databaseId);
      } catch (initError) {
        console.error("Failed to initialize Firestore:", initError);
      }
    }
    auth = getAuth(app);
    storage = getStorage(app);
  }
} else {
    console.error("Firebase configuration is missing or incomplete. Please check your NEXT_PUBLIC_FIREBASE_* environment variables.");
}


export { app, auth, db, storage };
