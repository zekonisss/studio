
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// NOTE: This object is now populated with the correct Firebase configuration
// from your project settings.
const FIREBASE_CLIENT_CONFIG = {
  apiKey: "AIzaSyBusk1Rtrpm-gfnwCdm12yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield.firebasestorage.app",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:d6d663ef7430182d781bd1"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(FIREBASE_CLIENT_CONFIG) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
