
"use client";

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, enableNetwork, Timestamp, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
};


function getFirebaseApp(options: FirebaseOptions) {
    return !getApps().length ? initializeApp(options) : getApp();
}

const app = getFirebaseApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);


// Enable Firestore network only in the browser to avoid SSR issues
if (typeof window !== "undefined") {
  enableNetwork(db)
    .catch((error) => {
      console.error("❌ Error enabling Firestore network:", error);
    });
}

export { db, auth, storage, Timestamp, serverTimestamp };
