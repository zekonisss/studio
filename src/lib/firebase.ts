// This file is safe to be imported on the server or client.
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const FIREBASE_CLIENT_CONFIG = {
  apiKey: "AIzaSyBusklRtrpm-gfnwCdmi2yj5vTumqLte3c",
  authDomain: "drivershield.firebaseapp.com",
  projectId: "drivershield",
  storageBucket: "drivershield-storage.appspot.com",
  messagingSenderId: "688007961476",
  appId: "1:688007961476:web:d6d663ef7430182d781bd1",
  measurementId: "G-WWHPWT8FGC"
};

// Initialize Firebase for client-side
// This function ensures that we only initialize the app once.
function getClientApp(config: FirebaseOptions) {
    if (getApps().length) {
        return getApp();
    }

    return initializeApp(config);
}

const app = getClientApp(FIREBASE_CLIENT_CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
