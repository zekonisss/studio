
"use client";

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, enableNetwork, Timestamp, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const FIREBASE_CLIENT_CONFIG: FirebaseOptions = {
  "projectId": "drivershield",
  "appId": "1:688007961476:web:0bf3aa76adba59f7781bd1",
  "storageBucket": "drivershield.appspot.com",
  "apiKey": "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  "authDomain": "drivershield.firebaseapp.com",
  "measurementId": "G-BKJYEF2X6Y",
  "messagingSenderId": "688007961476"
};

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
