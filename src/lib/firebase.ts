
// This file is safe to be imported on the client (browser).
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, enableNetwork, Timestamp, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config from your Firebase project
const FIREBASE_CLIENT_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:d6d663ef7430182d781bd1",
  measurementId: "G-WWHPWT8FGC"
};

function getFirebaseApp(options: FirebaseOptions) {
    return !getApps().length ? initializeApp(options) : getApp();
}

// This function can be called multiple times, it will only initialize once.
export function initializeFirebase() {
    return getFirebaseApp(FIREBASE_CLIENT_CONFIG);
}

const app = initializeFirebase();
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
