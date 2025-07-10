
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// =================================================================
// TODO: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
//
// 1. Open your Firebase project settings.
// 2. In the "General" tab, scroll down to "Your apps".
// 3. Click the "</>" (Web) icon to see your app's config.
// 4. Copy the `firebaseConfig` object and paste it below,
//    replacing the entire FIREBASE_CLIENT_CONFIG object.
// =================================================================
const FIREBASE_CLIENT_CONFIG = {
  // ===> PASTE YOUR REAL CONFIGURATION OBJECT HERE <===
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(FIREBASE_CLIENT_CONFIG) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
