
"use client";

// This file is safe to be imported on the client (browser).
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, enableNetwork, Timestamp, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Automatically parse Firebase config from environment variables
const FIREBASE_CLIENT_CONFIG: FirebaseOptions = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}"
);

if (!FIREBASE_CLIENT_CONFIG.apiKey) {
    console.error("Firebase config not found. Please check your environment variables.");
}

function getFirebaseApp(options: FirebaseOptions) {
    return !getApps().length ? initializeApp(options) : getApp();
}

const app = getFirebaseApp(FIREBASE_CLIENT_CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);


// Enable Firestore network only in the browser to avoid SSR issues
if (typeof window !== "undefined") {
  enableNetwork(db)
    .catch((error) => {
      console.error("❌ Error enabling Firestore network:", error);
    });
}

export { db, auth, Timestamp, serverTimestamp };
