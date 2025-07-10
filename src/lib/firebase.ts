
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// NOTE: This object will be populated with the correct Firebase configuration
// by the Firebase Studio environment during the build process.
// Do not manually enter credentials here.
const FIREBASE_CLIENT_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(FIREBASE_CLIENT_CONFIG) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
